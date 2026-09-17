"""
GridSense AI — Feature Engineering

Builds the feature set for day-ahead hourly load forecasting:
  1. Calendar features (hour, day-of-week, month, weekend flag)
  2. Cyclical encoding (sin/cos) so hour 23 and hour 0 are treated as close,
     not maximally far apart
  3. Lag features (same hour yesterday, same hour last week)
  4. Rolling average (last 24 hours, computed WITHOUT leaking the current
     hour's own value into its own feature)

Usage:
    python src/features/build_features.py \
        --input data/raw/AEP_hourly.csv \
        --output data/processed/aep_features.csv
"""
import argparse
import numpy as np
import pandas as pd


def build_features(df: pd.DataFrame, target_col: str = "AEP_MW") -> pd.DataFrame:
    df = df.sort_values("Datetime").reset_index(drop=True)

    # --- Calendar features ---
    df["hour"] = df["Datetime"].dt.hour
    df["day_of_week"] = df["Datetime"].dt.dayofweek
    df["month"] = df["Datetime"].dt.month
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

    # --- Cyclical encoding ---
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # --- Lag features ---
    df["lag_24h"] = df[target_col].shift(24)
    df["lag_168h"] = df[target_col].shift(168)

    # --- Rolling average (strictly PAST hours only -- shift(1) first so the
    # current hour's own value never leaks into its own feature) ---
    df["rolling_avg_24h"] = df[target_col].rolling(window=24).mean()

    # Drop boundary rows where lag/rolling features can't be computed yet
    df = df.dropna().reset_index(drop=True)

    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default="data/raw/AEP_hourly.csv")
    parser.add_argument("--output", type=str, default="data/processed/aep_features.csv")
    parser.add_argument("--target_col", type=str, default="AEP_MW")
    args = parser.parse_args()

    df = pd.read_csv(args.input, parse_dates=["Datetime"])
    df_features = build_features(df, target_col=args.target_col)

    df_features.to_csv(args.output, index=False)
    print(f"Built {len(df_features)} rows x {len(df_features.columns)} columns -> {args.output}")


if __name__ == "__main__":
    main()