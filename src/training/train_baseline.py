"""
GridSense AI — Baseline Model Training

Trains an XGBoost day-ahead load forecasting model and logs everything
with MLflow: the settings used, the resulting accuracy, and the model
file itself. This is what turns "I ran some code once" into "I have a
reproducible, comparable record of every experiment I've tried."

Usage:
    python src/training/train_baseline.py
    mlflow ui   # then open http://localhost:5000 to browse runs
"""
import argparse
import numpy as np
import pandas as pd
import mlflow
import mlflow.xgboost
from xgboost import XGBRegressor
mlflow.set_tracking_uri("sqlite:///mlflow.db")

FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "month_sin", "month_cos",
    "is_weekend", "lag_24h", "lag_168h", "rolling_avg_24h",
]
TARGET_COL = "AEP_MW"


def mean_absolute_error(y_true, y_pred):
    return np.abs(y_true - y_pred).mean()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="data/processed/aep_features.csv")
    parser.add_argument("--test_days", type=int, default=180)
    parser.add_argument("--n_estimators", type=int, default=200)
    parser.add_argument("--max_depth", type=int, default=5)
    parser.add_argument("--learning_rate", type=float, default=0.05)
    args = parser.parse_args()

    df = pd.read_csv(args.data, parse_dates=["Datetime"])
    cutoff = df["Datetime"].max() - pd.Timedelta(days=args.test_days)
    train = df[df["Datetime"] < cutoff]
    test = df[df["Datetime"] >= cutoff]

    X_train, y_train = train[FEATURE_COLS], train[TARGET_COL]
    X_test, y_test = test[FEATURE_COLS], test[TARGET_COL]

    # naive baseline: "tomorrow = same hour yesterday" -- the bar the real model must beat
    naive_mae = mean_absolute_error(y_test, test["lag_24h"])

    mlflow.set_experiment("gridsense-ai-day-ahead-forecast")
    with mlflow.start_run():
        params = {
            "n_estimators": args.n_estimators,
            "max_depth": args.max_depth,
            "learning_rate": args.learning_rate,
        }
        mlflow.log_params(params)
        mlflow.log_param("features", FEATURE_COLS)
        mlflow.log_param("train_rows", len(train))
        mlflow.log_param("test_rows", len(test))

        model = XGBRegressor(random_state=42, **params)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        model_mae = mean_absolute_error(y_test, preds)
        improvement_pct = (1 - model_mae / naive_mae) * 100

        mlflow.log_metric("naive_baseline_mae", naive_mae)
        mlflow.log_metric("model_mae", model_mae)
        mlflow.log_metric("improvement_pct_vs_naive", improvement_pct)

        mlflow.xgboost.log_model(model, "model")

        # Also save a plain file for the simple serving API to load directly
        import os
        os.makedirs("models", exist_ok=True)
        model.save_model("models/gridsense_baseline.json")

        print(f"Naive baseline MAE: {naive_mae:.1f} MW")
        print(f"Model MAE:          {model_mae:.1f} MW")
        print(f"Improvement:        {improvement_pct:.1f}% better than naive")
        print(f"Run logged under experiment 'gridsense-ai-day-ahead-forecast'")


if __name__ == "__main__":
    main()
