import numpy as np
import pandas as pd


def build_features_for_timestamp(history: pd.DataFrame, target_timestamp: pd.Timestamp) -> dict:
    history = history.sort_values("Datetime")

    lag_24_time = target_timestamp - pd.Timedelta(hours=24)
    lag_168_time = target_timestamp - pd.Timedelta(hours=168)

    lag_24h = history.loc[history["Datetime"] == lag_24_time, "AEP_MW"]
    lag_168h = history.loc[history["Datetime"] == lag_168_time, "AEP_MW"]

    if lag_24h.empty or lag_168h.empty:
        raise ValueError("Not enough history to build features for this timestamp")

    
    window_start = target_timestamp - pd.Timedelta(hours=47)
    window_end = target_timestamp - pd.Timedelta(hours=24)
    window = history[(history["Datetime"] >= window_start) & (history["Datetime"] <=window_end)]
    if len(window) < 24:
        raise ValueError("Not enough history to compute the 24-hour rolling average")
    rolling_avg_24h = window["AEP_MW"].mean()
    
    
    hour = target_timestamp.hour
    dow = target_timestamp.dayofweek
    month = target_timestamp.month

    return {
        "hour_sin": np.sin(2 * np.pi * hour / 24),
        "hour_cos": np.cos(2 * np.pi * hour / 24),
        "dow_sin": np.sin(2 * np.pi * dow / 7),
        "dow_cos": np.cos(2 * np.pi * dow / 7),
        "month_sin": np.sin(2 * np.pi * month / 12),
        "month_cos": np.cos(2 * np.pi * month / 12),
        "is_weekend": int(dow in [5, 6]),
        "lag_24h": float(lag_24h.iloc[0]),
        "lag_168h": float(lag_168h.iloc[0]),
        "rolling_avg_24h": float(rolling_avg_24h),
    }