# AI assisted docker file.
FROM python:3.12.6-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn app.core.fastapi_app:create_app --factory --host 0.0.0.0 --port ${PORT:-8000} --no-proxy-headers --timeout-graceful-shutdown 15 --ws-ping-interval 20 --ws-ping-timeout 20"]