"""
GridSense AI — Automated Test Suite

These tests run automatically on every push via GitHub Actions (Week 4).
Each one checks something we personally broke at least once while
building this project -- that's not a coincidence, it's the point:
tests exist to catch the exact mistakes a human already made once.

Run locally with:
    pytest tests/test_pipeline.py -v
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import pytest
import xgboost as xgb

from src.data.validate_data import validate
from src.features.build_features import build_features
from src.serving.feature_builder import build_features_for_timestamp


@pytest.fixture(scope="module")
def raw_data():
    return pd.read_csv("data/raw/AEP_hourly.csv", parse_dates=["Datetime"])


@pytest.fixture(scope="module")
def trained_model():
    model = xgb.XGBRegressor()
    model.load_model("models/gridsense_baseline.json")
    return model


def test_raw_data_passes_validation(raw_data):
    """Catches real data quality issues, e.g. schema drift, nulls, bad ranges."""
    result = validate(raw_data, value_col="AEP_MW")
    assert result.passed, f"Data validation failed: {result.errors}"


def test_no_rolling_average_leakage(raw_data):
    """
    Regression test for the real leakage bug we found: rolling_avg_24h must
    NOT include the current hour's own value. If someone changes
    build_features.py and accidentally removes the shift(1), this test
    catches it immediately instead of silently inflating accuracy again.
    """
    df = build_features(raw_data)
    sample_row = df[df["Datetime"] == "2018-06-15 15:00:00"].iloc[0]

    window_start = pd.Timestamp("2018-06-15 15:00:00") - pd.Timedelta(hours=24)
    window = raw_data[
        (raw_data["Datetime"] >= window_start) &
        (raw_data["Datetime"] < pd.Timestamp("2018-06-15 15:00:00"))
    ]
    expected = window["AEP_MW"].mean()

    assert abs(sample_row["rolling_avg_24h"] - expected) < 0.01, (
        "rolling_avg_24h appears to include the current hour's own value "
        "-- this is the leakage bug from Week 2. Check for a missing "
        "shift(1) in build_features.py"
    )


def test_training_serving_consistency(raw_data, trained_model):
    """
    The live feature-building path (used by the API) must match the
    training feature-building path. This is the test that proved our
    API wasn't silently using different logic than training.
    """
    FEATURE_COLS = [
        "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
        "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
    ]
    target_timestamp = pd.Timestamp("2018-06-15 15:00:00")

    live_features = build_features_for_timestamp(raw_data, target_timestamp)

    df_features = build_features(raw_data)
    training_row = df_features[df_features["Datetime"] == target_timestamp].iloc[0]

    for col in FEATURE_COLS:
        assert abs(live_features[col] - training_row[col]) < 0.01, (
            f"Mismatch in '{col}': live={live_features[col]}, "
            f"training={training_row[col]}. Training and serving have "
            f"drifted apart."
        )


def test_model_beats_naive_baseline(raw_data, trained_model):
    """
    Sanity check: the trained model must be meaningfully better than
    just guessing yesterday's value. If a future retrain somehow produces
    a worse model, this test fails loudly instead of silently shipping
    a regression.
    """
    df = build_features(raw_data)
    cutoff = df["Datetime"].max() - pd.Timedelta(days=180)
    test = df[df["Datetime"] >= cutoff]

    FEATURE_COLS = [
        "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
        "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
    ]
    preds = trained_model.predict(test[FEATURE_COLS])
    model_mae = (preds - test["AEP_MW"]).abs().mean()
    naive_mae = (test["lag_24h"] - test["AEP_MW"]).abs().mean()

    assert model_mae < naive_mae, (
        f"Model MAE ({model_mae:.1f}) is not better than naive baseline "
        f"({naive_mae:.1f}) -- something is seriously wrong."
    )
    assert model_mae < 700, f"Model MAE ({model_mae:.1f}) is worse than expected (<700 MW)"