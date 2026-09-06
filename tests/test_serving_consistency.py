"""
GridSense AI — Training/Serving Consistency Check

Runs the LIVE feature-building path (the same one the API uses) across
every hour in the held-out test set, and checks the resulting MAE matches
what training reported. If these numbers diverge, it means serving is
computing features differently than training did -- the exact
training-serving skew bug we've been careful to avoid.
"""
import pandas as pd
import xgboost as xgb
from src.serving.feature_builder import build_features_for_timestamp

FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
]

# Load raw history and the trained model
history = pd.read_csv("data/raw/AEP_hourly.csv", parse_dates=["Datetime"])
model = xgb.XGBRegressor()
model.load_model("models/gridsense_baseline.json")

# Same 180-day test cutoff used in training -- must match train_baseline.py
cutoff = history["Datetime"].max() - pd.Timedelta(days=180)
test_timestamps = history.loc[history["Datetime"] >= cutoff, "Datetime"]

errors = []
skipped = 0

for ts in test_timestamps:
    try:
        features = build_features_for_timestamp(history, ts)
    except ValueError:
        skipped += 1
        continue  # not enough lookback history right at the edge, expected

    X = pd.DataFrame([features])[FEATURE_COLS]
    pred = model.predict(X)[0]
    actual = history.loc[history["Datetime"] == ts, "AEP_MW"].iloc[0]
    errors.append(abs(pred - actual))

mae = sum(errors) / len(errors)
print(f"Rows tested: {len(errors)} (skipped {skipped} at the lookback edge)")
print(f"Live serving MAE: {mae:.1f} MW")
print(f"Training-reported MAE: 569.8 MW")
print(f"Match: {'YES' if abs(mae - 569.8) < 5 else 'NO -- investigate a mismatch'}")