# Multi-stage build: dependencies + runtime
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Create wheels (faster than pip installing in final stage)
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels

# Install packages from wheels (much faster than pip install)
COPY backend/requirements.txt .
RUN pip install --no-cache /wheels/*

# Create cache directories for HuggingFace models
RUN mkdir -p /root/.cache/huggingface/hub

# Copy backend code
COPY backend/ .

# Copy attack images (if they exist)
RUN mkdir -p attack models

# Pre-cache lightweight model for faster first run (optional but recommended)
# Removes 20-40s delay on first model load
RUN python -c "from transformers import AutoImageProcessor, AutoModelForImageClassification; \
    print('Caching model...'); \
    AutoImageProcessor.from_pretrained('google/mobilenet-v2'); \
    AutoModelForImageClassification.from_pretrained('google/mobilenet-v2'); \
    print('✅ Model cached')" || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/api/health')" || exit 1

# Expose port
EXPOSE 5000

# Run Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "300", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
