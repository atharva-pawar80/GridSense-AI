"""
GridSense AI — Retrain Trigger

Closes the loop: monitoring (Week 5) detects problems, this decides
whether they're serious enough to warrant an automatic retrain, and if
so, actually runs the training pipeline.

Decision rule (deliberately simple and explainable, not black-box):
    Retrain if EITHER is true:
      - 2 or more of the last 4 weeks were flagged as high-error
      - Any monitored feature shows "significant shift" in drift check

This is intentionally conservative -- a single bad week (weather, a
one-off event) should NOT trigger a retrain on its own, since that would
make the system twitchy and expensive to run. A sustained pattern, or a
real distributional shift, is a stronger signal worth acting on.

Usage:
    python src/monitoring/retrain_trigger.py
    python src/monitoring/retrain_trigger.py --execute   # actually retrains if triggered
"""
import argparse
import subprocess
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import pandas as pd
import xgboost as xgb

from src.features.build_features import build_features
from src.monitoring.track_accuracy import compute_weekly_accuracy, flag_drift
from src.monitoring.detect_drift import compute_psi, interpret_psi, FEATURES_TO_CHECK

RECENT_WEEKS_TO_CHECK = 4
FLAGGED_WEEKS_THRESHOLD = 2


def check_accuracy_trigger(features_df: pd.DataFrame, model) -> tuple[bool, str]:
    cutoff = features_df["Datetime"].max() - pd.Timedelta(days=180)
    test = features_df[features_df["Datetime"] >= cutoff]

    weekly = compute_weekly_accuracy(test, model)
    baseline_mae = weekly["mae"].mean()
    weekly = flag_drift(weekly, baseline_mae)

    recent_weeks = weekly.tail(RECENT_WEEKS_TO_CHECK)
    n_flagged = recent_weeks["flagged"].sum()

    triggered = n_flagged >= FLAGGED_WEEKS_THRESHOLD
    reason = (
        f"{n_flagged}/{RECENT_WEEKS_TO_CHECK} of the most recent weeks flagged "
        f"as high-error (threshold: {FLAGGED_WEEKS_THRESHOLD}+)"
    )
    return triggered, reason


def check_drift_trigger(features_df: pd.DataFrame) -> tuple[bool, str]:
    recent_start = features_df["Datetime"].max() - pd.Timedelta(days=30)
    recent_end = features_df["Datetime"].max()
    prior_year_start = recent_start - pd.Timedelta(days=365)
    prior_year_end = recent_end - pd.Timedelta(days=365)

    recent_data = features_df[(features_df["Datetime"] >= recent_start) & (features_df["Datetime"] <= recent_end)]
    reference_data = features_df[(features_df["Datetime"] >= prior_year_start) & (features_df["Datetime"] <= prior_year_end)]

    shifted_features = []
    for feature in FEATURES_TO_CHECK:
        psi = compute_psi(reference_data[feature], recent_data[feature])
        if interpret_psi(psi) == "significant shift":
            shifted_features.append(f"{feature} (PSI={psi:.3f})")

    triggered = len(shifted_features) > 0
    reason = (
        f"Significant drift in: {', '.join(shifted_features)}" if shifted_features
        else "No features show significant drift"
    )
    return triggered, reason


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Actually run retraining if triggered (default: dry run, just reports the decision)")
    args = parser.parse_args()

    raw = pd.read_csv("data/raw/AEP_hourly.csv", parse_dates=["Datetime"])
    features_df = build_features(raw)

    model = xgb.XGBRegressor()
    model.load_model("models/gridsense_baseline.json")

    accuracy_triggered, accuracy_reason = check_accuracy_trigger(features_df, model)
    drift_triggered, drift_reason = check_drift_trigger(features_df)

    print("=== Retrain Decision Report ===\n")
    print(f"Accuracy check: {'TRIGGERED' if accuracy_triggered else 'ok'}")
    print(f"  {accuracy_reason}\n")
    print(f"Drift check:    {'TRIGGERED' if drift_triggered else 'ok'}")
    print(f"  {drift_reason}\n")

    should_retrain = accuracy_triggered or drift_triggered

    if should_retrain:
        print("DECISION: Retrain recommended.")
        if args.execute:
            print("\n--execute flag set -- running training pipeline now...\n")
            subprocess.run(["python", "src/training/train_baseline.py"], check=True)
            print("\nRetraining complete. Review the new MLflow run before promoting it to production.")
        else:
            print("(Dry run -- pass --execute to actually retrain.)")
    else:
        print("DECISION: No retrain needed. Model is performing within expected bounds.")


if __name__ == "__main__":
    main()