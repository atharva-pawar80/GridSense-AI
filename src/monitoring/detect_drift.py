"""
GridSense AI — Drift Detection (Population Stability Index)

Checks whether recent real data statistically LOOKS different from the
data the model was trained on -- an earlier warning signal than waiting
for prediction accuracy to visibly drop (see track_accuracy.py).

PSI (Population Stability Index) is a standard technique: bucket a
feature's values into groups based on the training distribution, then
compare what % of data falls in each bucket for the training period vs.
a recent window. Big differences = the incoming data no longer looks
like what the model learned from.

Interpretation (industry-standard thresholds):
    PSI < 0.10           -> no significant shift
    0.10 <= PSI < 0.25    -> moderate shift, worth investigating
    PSI >= 0.25           -> significant shift, model may be unreliable

Usage:
    python src/monitoring/detect_drift.py
"""
import pandas as pd
import numpy as np

FEATURES_TO_CHECK = ["AEP_MW", "lag_24h", "rolling_avg_24h"]


def compute_psi(training_values: pd.Series, recent_values: pd.Series, n_bins: int = 10) -> float:
    # Build bin edges from the TRAINING distribution -- recent data gets
    # sorted into these same bins, whatever they contain.
    bin_edges = np.quantile(training_values, np.linspace(0, 1, n_bins + 1))
    bin_edges[0] -= 1e-6  # avoid edge-case where the minimum value falls outside its own bin
    bin_edges[-1] += 1e-6

    train_counts, _ = np.histogram(training_values, bins=bin_edges)
    recent_counts, _ = np.histogram(recent_values, bins=bin_edges)

    train_pct = train_counts / train_counts.sum()
    recent_pct = recent_counts / recent_counts.sum()

    # Avoid division by zero / log(0) for empty bins
    train_pct = np.clip(train_pct, 1e-6, None)
    recent_pct = np.clip(recent_pct, 1e-6, None)

    psi = np.sum((recent_pct - train_pct) * np.log(recent_pct / train_pct))
    return psi


def interpret_psi(psi: float) -> str:
    if psi < 0.10:
        return "stable"
    elif psi < 0.25:
        return "moderate shift"
    else:
        return "significant shift"


def main():
    df = pd.read_csv("data/processed/aep_features.csv", parse_dates=["Datetime"])

    # IMPORTANT: comparing a 30-day recent window against a multi-year
    # training distribution is methodologically wrong -- it mixes real
    # drift together with ordinary seasonality (e.g. summer always looks
    # "different" from an all-season average, even with zero real drift).
    # The correct comparison is season-controlled: recent 30 days vs. the
    # SAME 30 calendar days one year earlier.
    recent_start = df["Datetime"].max() - pd.Timedelta(days=30)
    recent_end = df["Datetime"].max()
    prior_year_start = recent_start - pd.Timedelta(days=365)
    prior_year_end = recent_end - pd.Timedelta(days=365)

    recent_data = df[(df["Datetime"] >= recent_start) & (df["Datetime"] <= recent_end)]
    reference_data = df[(df["Datetime"] >= prior_year_start) & (df["Datetime"] <= prior_year_end)]

    print(f"Reference window (same season, 1 year earlier): {reference_data['Datetime'].min()} to {reference_data['Datetime'].max()} ({len(reference_data)} rows)")
    print(f"Recent window:                                   {recent_data['Datetime'].min()} to {recent_data['Datetime'].max()} ({len(recent_data)} rows)\n")

    results = []
    for feature in FEATURES_TO_CHECK:
        psi = compute_psi(reference_data[feature], recent_data[feature])
        status = interpret_psi(psi)
        results.append({"feature": feature, "psi": round(psi, 4), "status": status})
        flag = "⚠" if psi >= 0.10 else "✓"
        print(f"{flag} {feature:20s} PSI = {psi:.4f}  ({status})")

    n_shifted = sum(1 for r in results if r["status"] != "stable")
    print()
    if n_shifted > 0:
        print(f"⚠ {n_shifted} feature(s) show drift from the same period last year.")
    else:
        print("✓ No significant drift detected -- this period looks statistically similar to the same period last year.")


if __name__ == "__main__":
    main()