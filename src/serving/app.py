"""
GridSense AI — Serving API (with monitoring endpoints)

Usage:
    uvicorn src.serving.app:app --reload
"""
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.serving.feature_builder import build_features_for_timestamp
from src.features.build_features import build_features
from src.monitoring.track_accuracy import compute_weekly_accuracy, flag_drift
from src.monitoring.detect_drift import compute_psi, interpret_psi, FEATURES_TO_CHECK

app = FastAPI(title="GridSense AI — Day-Ahead Load Forecast")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
]

_model = None
_history = None
_features_df = None  # cached processed features, so monitoring endpoints don't rebuild on every call


class PredictionRequest(BaseModel):
    target_timestamp: str


class PredictionResponse(BaseModel):
    predicted_mw: float
    target_timestamp: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    target_timestamp = pd.Timestamp(request.target_timestamp)
    try:
        features = build_features_for_timestamp(_history, target_timestamp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    X = pd.DataFrame([features])[FEATURE_COLS]
    prediction = _model.predict(X)[0]
    return PredictionResponse(predicted_mw=float(prediction), target_timestamp=str(target_timestamp))


@app.get("/predict/day")
def predict_day(date: str):
    base = pd.Timestamp(date)
    results = []
    for hour in range(24):
        target_timestamp = base + pd.Timedelta(hours=hour)
        try:
            features = build_features_for_timestamp(_history, target_timestamp)
        except ValueError:
            continue
        X = pd.DataFrame([features])[FEATURE_COLS]
        pred = _model.predict(X)[0]
        results.append({
            "hour": f"{target_timestamp.hour % 12 or 12}{'am' if target_timestamp.hour < 12 else 'pm'}",
            "timestamp": str(target_timestamp),
            "predicted": float(pred),
            "lag_24h": features["lag_24h"],
            "lag_168h": features["lag_168h"],
        })
    return {"date": date, "predictions": results}


@app.get("/monitoring/accuracy")
def monitoring_accuracy():
    """
    Weekly accuracy over the held-out test period. Lets the dashboard show
    a trend line instead of one static number -- a rising trend is an
    early sign the model is going stale.
    """
    cutoff = _features_df["Datetime"].max() - pd.Timedelta(days=180)
    test = _features_df[_features_df["Datetime"] >= cutoff]

    weekly = compute_weekly_accuracy(test, _model)
    baseline_mae = weekly["mae"].mean()
    weekly = flag_drift(weekly, baseline_mae)

    return {
        "baseline_mae": round(baseline_mae, 1),
        "weeks": [
            {
                "week_start": str(row["week_start"].date()),
                "mae": round(row["mae"], 1),
                "flagged": bool(row["flagged"]),
            }
            for _, row in weekly.iterrows()
        ],
    }


@app.get("/monitoring/drift")
def monitoring_drift():
    """
    Season-controlled PSI drift check: most recent 30 days vs. the same
    30 calendar days one year earlier. See detect_drift.py for why the
    comparison is done this way (naive comparisons conflate seasonality
    with real drift).
    """
    df = _features_df
    recent_start = df["Datetime"].max() - pd.Timedelta(days=30)
    recent_end = df["Datetime"].max()
    prior_year_start = recent_start - pd.Timedelta(days=365)
    prior_year_end = recent_end - pd.Timedelta(days=365)

    recent_data = df[(df["Datetime"] >= recent_start) & (df["Datetime"] <= recent_end)]
    reference_data = df[(df["Datetime"] >= prior_year_start) & (df["Datetime"] <= prior_year_end)]

    results = []
    for feature in FEATURES_TO_CHECK:
        psi = compute_psi(reference_data[feature], recent_data[feature])
        results.append({
            "feature": feature,
            "psi": round(float(psi), 4),
            "status": interpret_psi(psi),
        })

    return {
        "recent_window": f"{recent_start.date()} to {recent_end.date()}",
        "reference_window": f"{prior_year_start.date()} to {prior_year_end.date()}",
        "features": results,
    }


@app.on_event("startup")
def load_model_and_history():
    global _model, _history, _features_df
    _model = xgb.XGBRegressor()
    _model.load_model("models/gridsense_baseline.json")
    _history = pd.read_csv("data/raw/AEP_hourly.csv", parse_dates=["Datetime"])
    _features_df = build_features(_history.copy())