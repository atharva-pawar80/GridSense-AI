"""
GridSense AI — Accuracy Monitoring

Instead of one single "average error" number, this tracks accuracy
WEEK BY WEEK across the held-out test period. A rising trend in weekly
error is an early warning sign the model is going stale -- something a
single overall MAE number can hide completely (a model could look fine
on average while getting steadily worse for the most recent weeks).

Usage:
    python src/monitoring/track_accuracy.py
"""
import pandas as pd
import numpy as np
import xgboost as xgb

FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
]
TARGET_COL = "AEP_MW"


def compute_weekly_accuracy(df: pd.DataFrame, model) -> pd.DataFrame:
    df = df.copy()
    preds = model.predict(df[FEATURE_COLS])
    df["error"] = np.abs(preds - df[TARGET_COL])
    df["week"] = df["Datetime"].dt.to_period("W").apply(lambda p: p.start_time)

    weekly = df.groupby("week")["error"].agg(["mean", "count"]).reset_index()
    weekly.columns = ["week_start", "mae", "n_predictions"]
    return weekly


def flag_drift(weekly: pd.DataFrame, baseline_mae: float, threshold_pct: float = 20.0) -> pd.DataFrame:
    """
    Flags any week where error is more than `threshold_pct` worse than the
    baseline (overall test-set) MAE. This is a simple, explainable rule --
    real systems often use more sophisticated statistical tests, but a
    clear percentage threshold is honest, easy to reason about, and easy
    to explain in an interview.
    """
    weekly = weekly.copy()
    weekly["pct_above_baseline"] = ((weekly["mae"] - baseline_mae) / baseline_mae) * 100
    weekly["flagged"] = weekly["pct_above_baseline"] > threshold_pct
    return weekly


def main():
    df = pd.read_csv("data/processed/aep_features.csv", parse_dates=["Datetime"])
    cutoff = df["Datetime"].max() - pd.Timedelta(days=180)
    test = df[df["Datetime"] >= cutoff]

    model = xgb.XGBRegressor()
    model.load_model("models/gridsense_baseline.json")

    weekly = compute_weekly_accuracy(test, model)
    baseline_mae = weekly["mae"].mean()  # simple stand-in for the "known good" number
    weekly = flag_drift(weekly, baseline_mae)

    print(f"Baseline (average) weekly MAE: {baseline_mae:.1f} MW\n")
    print(weekly.to_string(index=False))

    n_flagged = weekly["flagged"].sum()
    if n_flagged > 0:
        print(f"\n⚠ {n_flagged} week(s) flagged as significantly worse than baseline.")
    else:
        print(f"\n✓ No weeks flagged -- accuracy has been stable across the test period.")


if __name__ == "__main__":
    main()