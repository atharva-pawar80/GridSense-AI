# GridSense

*Next-day hourly electricity demand forecasting for a real US grid operator.*

## The real-world problem

Grid operators must forecast electricity demand hours to days ahead to schedule
power generation. The cost structure is asymmetric:

- **Under-forecast** → risk of blackouts or emergency spot-market power purchases
  at extreme premiums
- **Over-forecast** → wasted reserve generation capacity, unnecessary cost

This project forecasts hourly load for **AEP (American Electric Power)**, using
real hourly demand data reported by PJM Interconnection, the regional
transmission organization coordinating grid operations across 13 US states.
This is genuine utility-reported data — not synthetic.

**Source:** PJM Interconnection LLC, hourly load data (MW), Oct 2004 – Aug 2018,
121,273 hourly readings. Originally published via Kaggle
(`robikscube/hourly-energy-consumption`), sourced here from a public GitHub
mirror since the raw values are unchanged.

## Status

- [x] Week 1 — Data acquisition + validation
- [ ] Week 2 — Feature engineering + baseline forecasting model
- [ ] Week 3 — Serving API (forecast-on-demand)
- [ ] Week 4 — CI/CD pipeline
- [ ] Week 5 — Monitoring + forecast error tracking
- [ ] Week 6 — Retrain trigger + case-study writeup

## Week 1 finding: real data validation is not "check for nulls"

Naively checking this dataset for gaps and duplicates gives 27 "missing hours"
and 8 "duplicate timestamps" — which look like data quality bugs. They aren't
(mostly). Investigating properly against actual US Daylight Saving Time
transition dates (using the IANA time zone database, which correctly encodes
the fact that the US DST rule itself changed in 2007 — the Energy Policy Act
of 2005 moved the start date from the first Sunday in April to the second
Sunday in March, effective 2007) explains almost everything:

| Anomaly | Count | Explanation |
|---|---|---|
| Missing hours on DST spring-forward dates | 14 | Expected — that clock hour never occurs locally. Correctly matches the pre-2007 April rule (2005, 2006) and post-2007 March rule. |
| Duplicate timestamps on DST fall-back dates (2014–2017 only) | 8 (4 dates) | Expected — that clock hour occurs twice. |
| Missing hours on DST fall-back dates (2004–2013) | 13 | **Not a DST artifact in the usual sense** — this reveals that PJM/AEP's own data pipeline handled the repeated fall-back hour differently in earlier years (dropped one reading) than in later years (kept both, causing a duplicate instead). This is a genuine change in the source system's data collection methodology partway through the 14-year window. |

Takeaway used going forward: rather than blanket-imputing all gaps/duplicates
the same way, spring-forward gaps are structural (skip, don't impute) and the
fall-back inconsistency is handled explicitly as a known source-system quirk
in the feature engineering step — not silently smoothed over.

### Run it yourself
```bash
pip install -r requirements.txt
python src/data/download_data.py
python src/data/validate_data.py --path data/raw/AEP_hourly.csv
```

## Schema

| Column | Type | Description |
|---|---|---|
| Datetime | datetime | hourly timestamp, US Eastern local time |
| AEP_MW | float | electricity load in megawatts |

## Tech stack

Pandas/NumPy · scikit-learn / Prophet / XGBoost (Week 2) · MLflow · FastAPI · Docker · GitHub Actions · Prometheus/Grafana
