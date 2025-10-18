FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install OpenCV system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=main.py

# Run migrations then start gunicorn
CMD ["/bin/sh", "-c", "echo 'Running database migrations...' && python release.py && echo 'Starting Gunicorn...' && gunicorn wsgi:app --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 4 --timeout 120 --log-level info --access-logfile - --error-logfile -"]
