# GridSense AI

**Day-ahead hourly electricity load forecasting for a real U.S. grid operator, with a complete production MLOps stack: validated data, leakage-free feature engineering, a serving API, CI/CD, monitoring, and an automated retrain trigger.**

![status](https://img.shields.io/badge/status-active-brightgreen)
![python](https://img.shields.io/badge/python-3.12-blue)
![tests](https://img.shields.io/badge/tests-passing-brightgreen)

---

## The problem

Grid operators must schedule power generation hours to days in advance. The cost of getting it wrong is asymmetric:

- **Under-forecast** → risk of blackouts or emergency spot-market power purchases at extreme prices
- **Over-forecast** → wasted reserve generation capacity, unnecessary cost

This project forecasts hourly load for **AEP (American Electric Power)**, part of the PJM Interconnection, using their real published data — 121,273 hourly readings, October 2004 to August 2018. Not synthetic data.

## Results

| Metric | Value |
|---|---|
| Naive baseline (same hour, last week) | 919.4 MW average error |
| GridSense AI (XGBoost) | **569.8 MW average error** |
| Improvement | **38.0%** |
| Training-serving consistency (validated across 4,295 real held-out hours) | within 0.4% |

## Architecture

```
Real AEP data → Validation → Feature engineering → Model training (MLflow)
                                                          ↓
                                    FastAPI serving ← CI/CD (GitHub Actions)
                                          ↓
                              React dashboard ← Monitoring (accuracy + drift)
                                                          ↓
                                              Automated retrain trigger
```

## What makes this more than a notebook model

Most portfolio forecasting projects stop at "trained a model, got a metric." This one includes the parts that make a system trustworthy in production — and several real bugs were found and fixed along the way, each with a regression test to keep them fixed:

- **Data leakage found and fixed**: a rolling-average feature was accidentally including the target hour's own value. Caught by comparing the live serving pipeline against training output for the same timestamp — they disagreed, which exposed the bug. Reported accuracy corrected from an inflated 40.3% to an honest 38.0%.
- **Training-serving skew ruled out**: the API computes features live from raw history, not from a pre-baked file. Verified by running the live feature-building path across the entire held-out test set and confirming it reproduced the training MAE.
- **A real data-quality finding, not a generic "cleaned the data" claim**: DST-related timestamp anomalies were investigated against actual historical U.S. DST transition rules (including the 2007 rule change), which revealed the source utility changed its own fall-back-hour logging methodology partway through the 14-year collection window.
- **Season-controlled drift detection**: an early version of the drift check compared a 30-day window against the full multi-year training distribution — which conflated ordinary seasonality with real drift (PSI = 2.53, an unrealistic result). Fixed by comparing season-matched year-over-year windows, and the result was independently validated against a random self-split to rule out sampling noise.
- **CI/CD verified, not just configured**: the pipeline was deliberately broken (leakage bug reintroduced) and pushed, confirming the GitHub Actions test suite actually blocks bad code — then reverted with `git revert` to preserve an honest commit history.
- **Cross-platform bugs fixed**: a Windows-incompatible `strftime("%-I%p")` call, and an ambiguous MLflow default tracking URI (`sqlite:////` vs `sqlite:///`) that silently pointed at the wrong file depending on OS.

## Tech stack

| Layer | Tools |
|---|---|
| Data & validation | Pandas, NumPy, custom DST-aware validators |
| Modeling | XGBoost, scikit-learn |
| Experiment tracking | MLflow |
| Serving | FastAPI, Uvicorn, Pydantic |
| Frontend | React (Vite), Recharts |
| Testing | pytest |
| CI/CD | GitHub Actions, branch protection rulesets |
| Monitoring | Custom PSI (Population Stability Index) drift detection, weekly rolling accuracy tracking |

## Project structure

```
GridSense-AI/
├── src/
│   ├── data/            # download + validation
│   ├── features/         # feature engineering
│   ├── training/          # model training (MLflow-tracked)
│   ├── serving/            # FastAPI app + live feature builder
│   └── monitoring/          # weekly accuracy, drift detection, retrain trigger
├── dashboard/             # React dashboard (Vite + Recharts)
├── tests/                   # pytest suite, run automatically in CI
├── .github/workflows/        # GitHub Actions
└── models/                     # trained model artifacts
```

## Running it locally

```bash
# 1. Set up environment
python -m venv .venv
source .venv/Scripts/activate   # or .venv/bin/activate on Mac/Linux
pip install -r requirements.txt

# 2. Get the real data and train the model
python src/data/download_data.py
python src/features/build_features.py
python src/training/train_baseline.py

# 3. Run the tests
pytest tests/test_pipeline.py -v

# 4. Start the API
python -m uvicorn src.serving.app:app --reload

# 5. Start the dashboard (separate terminal)
cd dashboard
npm install
npm run dev
```

## Monitoring & the retrain trigger

Two independent, complementary checks:

- **Weekly accuracy tracking** — flags any week where error is 20%+ worse than the 6-month average. Real result: 5 of 27 weeks flagged, clustering around winter cold snaps and spring/summer weather-transition periods — consistent with the model's known limitation (no weather data).
- **PSI-based drift detection** — compares recent data against the same calendar period one year earlier (season-controlled), so normal seasonality isn't mistaken for real drift.

The retrain trigger (`src/monitoring/retrain_trigger.py`) applies a simple, explainable rule: retrain if 2+ of the last 4 weeks are flagged, OR any feature shows significant drift. Supports a `--execute` flag; defaults to a dry-run report.

## Known limitations

- No weather data (a real, evidenced gap — see monitoring findings above)
- Single point predictions; the dashboard shows a fixed ±570 MW band, not a per-prediction confidence interval
- No holiday-awareness feature

## License

MIT