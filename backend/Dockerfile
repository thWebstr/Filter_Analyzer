# ── Build stage ────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# Install system deps needed by scipy/numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libatlas-base-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# ── Runtime ─────────────────────────────────────────────────────
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
