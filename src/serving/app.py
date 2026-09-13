"""
GridSense AI — Serving API (Pass 2: computes features live)

Instead of expecting pre-computed features, this API takes just a target
timestamp and looks up recent history itself, using the same feature
logic as training (src/features/build_features.py) via feature_builder.py.

In production, `history` would be loaded from a live database updated
continuously. Here it's loaded from the raw CSV as a stand-in — the
feature-computation logic is identical either way.

Usage:
    uvicorn src.serving.app:app --reload
"""
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from src.serving.feature_builder import build_features_for_timestamp

app = FastAPI(title="GridSense AI — Day-Ahead Load Forecast")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # only trust our dashboard's address
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
]

_model = None
_history = None


class PredictionRequest(BaseModel):
    target_timestamp: str  # e.g. "2018-06-15 15:00:00"


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

    X = pd.DataFrame([features])[FEATURE_COLS]  # enforce correct column order
    prediction = _model.predict(X)[0]

    return PredictionResponse(
        predicted_mw=float(prediction),
        target_timestamp=str(target_timestamp),
    )


@app.on_event("startup")
def load_model_and_history():
    global _model, _history
    _model = xgb.XGBRegressor()
    _model.load_model("models/gridsense_baseline.json")
    _history = pd.read_csv("data/raw/AEP_hourly.csv", parse_dates=["Datetime"])


@app.get("/predict/day")
def predict_day(date: str):
    """Returns predictions for all 24 hours of the given date, e.g. ?date=2018-06-15"""
    base = pd.Timestamp(date)
    results = []
    for hour in range(24):
        target_timestamp = base + pd.Timedelta(hours=hour)
        try:
            features = build_features_for_timestamp(_history, target_timestamp)
        except ValueError:
            continue  # not enough history for this hour, skip it
        X = pd.DataFrame([features])[FEATURE_COLS]
        pred = _model.predict(X)[0]
        results.append({
            "hour": f"{target_timestamp.hour % 12 or 12}{'am' if target_timestamp.hour < 12 else 'pm'}",
            "timestamp": str(target_timestamp),
            "predicted": float(pred),
        })
    return {"date": date, "predictions": results}
