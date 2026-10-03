FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements-serving.txt .
RUN pip install --no-cache-dir -r requirements-serving.txt \
    && useradd --create-home --uid 10001 appuser

COPY src/ ./src/
COPY models/gridsense_baseline.json ./models/gridsense_baseline.json
COPY data/raw/AEP_hourly.csv ./data/raw/AEP_hourly.csv

USER appuser

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.serving.app:app", "--host", "0.0.0.0", "--port", "8000"]
