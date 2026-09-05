"""
GridSense — Data Validation

Real-world hourly time series data has a specific failure mode that
synthetic data never shows you: Daylight Saving Time transitions.
- Spring forward: clocks skip 2:00-2:59 AM -> a "missing" hour that is
  NOT a data quality bug.
- Fall back: 1:00-1:59 AM occurs twice -> a "duplicate" timestamp that is
  ALSO not a data quality bug.

A naive validator would flag both as errors. This one distinguishes real
gaps/duplicates (data quality issues to fix) from expected DST artifacts
(which should be handled explicitly in feature engineering, not silently
dropped or imputed).

Usage:
    python src/data/validate_data.py --path data/raw/AEP_hourly.csv
"""
import argparse
import sys
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta
import pandas as pd

# AEP operates in the US Eastern time zone. Using ZoneInfo (IANA tz database)
# instead of a hardcoded "DST is always in March/hour 2" assumption matters
# here: the US DST rule itself changed in 2007 (Energy Policy Act of 2005
# moved the start from the first Sunday in April to the second Sunday in
# March). ZoneInfo has the correct historical rule baked in for every year,
# so this check is accurate across the full 2004-2018 span instead of only
# post-2007.
TZ = ZoneInfo("America/New_York")


def dst_transition_dates(year: int):
    """Return (spring_forward_date, fall_back_date) for US Eastern time in a given year.

    Compares the UTC offset at local midnight vs. local noon on each day —
    since US DST transitions happen at 2 AM local time, this straddles the
    transition and reliably flags the correct calendar date.
    """
    spring, fall = None, None
    day = datetime(year, 1, 1)
    while day.year == year:
        midnight_offset = day.replace(hour=0, tzinfo=TZ).utcoffset()
        noon_offset = day.replace(hour=12, tzinfo=TZ).utcoffset()
        if noon_offset != midnight_offset:
            if noon_offset > midnight_offset:
                spring = day.date()
            else:
                fall = day.date()
        day += timedelta(days=1)
    return spring, fall


def build_dst_date_set(years):
    spring_dates, fall_dates = set(), set()
    for y in years:
        s, f = dst_transition_dates(y)
        if s:
            spring_dates.add(s)
        if f:
            fall_dates.add(f)
    return spring_dates, fall_dates


class ValidationResult:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def add_error(self, msg):
        self.errors.append(msg)

    def add_warning(self, msg):
        self.warnings.append(msg)

    def add_info(self, msg):
        self.info.append(msg)

    @property
    def passed(self):
        return len(self.errors) == 0

    def report(self):
        lines = []
        if self.errors:
            lines.append(f"FAILED — {len(self.errors)} error(s):")
            lines += [f"  ✗ {e}" for e in self.errors]
        else:
            lines.append("PASSED — no data quality errors")
        if self.warnings:
            lines.append(f"{len(self.warnings)} warning(s):")
            lines += [f"  ⚠ {w}" for w in self.warnings]
        if self.info:
            lines.append(f"{len(self.info)} info note(s):")
            lines += [f"  ℹ {i}" for i in self.info]
        return "\n".join(lines)


# Matched by calendar date, not a hardcoded hour — the exact hour affected
# depends on how the source system labels intervals, but the *date* of a
# DST transition is unambiguous once looked up correctly per year.


def validate(df: pd.DataFrame, value_col: str = "AEP_MW") -> ValidationResult:
    result = ValidationResult()

    required_cols = {"Datetime", value_col}
    missing_cols = required_cols - set(df.columns)
    if missing_cols:
        result.add_error(f"Missing columns: {missing_cols}")
        return result

    df = df.copy()
    df["Datetime"] = pd.to_datetime(df["Datetime"])
    df = df.sort_values("Datetime")

    # 1. Null check
    n_null = df[value_col].isnull().sum()
    if n_null > 0:
        result.add_error(f"{n_null} null values in '{value_col}'")

    # 2. Range sanity check — grid load should never be negative or absurdly high
    if (df[value_col] < 0).any():
        result.add_error(f"{(df[value_col] < 0).sum()} negative load values")
    if (df[value_col] > 100000).any():
        result.add_warning("Some values exceed 100,000 MW — verify units/outliers")

    # Look up real DST transition dates (per-year, historically accurate)
    # for every year spanned by the data.
    years = range(df["Datetime"].dt.year.min(), df["Datetime"].dt.year.max() + 1)
    spring_dates, fall_dates = build_dst_date_set(years)

    # 3. Duplicate timestamps — separate DST fall-back from real duplicates
    dupes = df[df["Datetime"].duplicated(keep=False)]
    dupe_dates = dupes["Datetime"].dt.date
    is_fall_back = dupe_dates.isin(fall_dates)
    real_dupes = dupes[~is_fall_back]
    dst_dupes = dupes[is_fall_back]
    if len(real_dupes) > 0:
        result.add_error(f"{len(real_dupes)} unexplained duplicate timestamps: "
                          f"{sorted(set(real_dupes['Datetime']))[:5]}")
    if len(dst_dupes) > 0:
        result.add_info(
            f"{len(dst_dupes)} duplicate timestamps fall on real US DST "
            f"fall-back dates — expected artifact, not a data error"
        )

    # 4. Gaps — separate DST spring-forward from real missing data
    df_dedup = df.drop_duplicates(subset="Datetime")
    full_range = pd.date_range(df_dedup["Datetime"].min(), df_dedup["Datetime"].max(), freq="h")
    missing = full_range.difference(df_dedup["Datetime"])
    missing_dates = pd.Series(missing).dt.date
    is_spring_forward = missing_dates.isin(spring_dates)
    real_gaps = [ts for ts, is_dst in zip(missing, is_spring_forward) if not is_dst]
    dst_gaps = [ts for ts, is_dst in zip(missing, is_spring_forward) if is_dst]

    if real_gaps:
        result.add_warning(f"{len(real_gaps)} unexplained missing hours (real gaps): "
                            f"{[str(t) for t in real_gaps[:5]]}")
    if dst_gaps:
        result.add_info(
            f"{len(dst_gaps)} missing hours fall on real US DST spring-forward "
            f"dates (correctly accounting for the pre/post-2007 rule change) — "
            f"expected artifact, not a data error"
        )

    # 5. Minimum row count
    if len(df) < 1000:
        result.add_error(f"Only {len(df)} rows — too few to model seasonality")

    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", type=str, default="data/raw/AEP_hourly.csv")
    parser.add_argument("--value_col", type=str, default="AEP_MW")
    args = parser.parse_args()

    df = pd.read_csv(args.path)
    result = validate(df, value_col=args.value_col)
    print(result.report())

    if not result.passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
