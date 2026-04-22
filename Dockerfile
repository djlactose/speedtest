# syntax=docker/dockerfile:1.7

# Pinned by digest for reproducibility and Docker Scout tracking.
# Refresh the digest periodically: `docker buildx imagetools inspect python:3.13-slim-bookworm`
ARG PYTHON_IMAGE=python:3.13-slim-bookworm@sha256:bb73517d48bd32016e15eade0c009b2724ec3a025a9975b5cd9b251d0dcadb33

FROM ${PYTHON_IMAGE} AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build

RUN apt-get update \
 && apt-get upgrade -y \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.lock ./
RUN pip install --prefix=/install --no-compile -r requirements.lock


FROM ${PYTHON_IMAGE} AS runtime

ARG APP_UID=1000
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    WORKERS=4 \
    PORT=8080 \
    UPLOAD_FOLDER=/tmp

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends tini \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* \
 && useradd -m -u ${APP_UID} appuser

WORKDIR /usr/src/app

COPY --from=builder /install /usr/local
COPY --chown=appuser:appuser main.py index.html 100MB.bin ./
COPY --chown=appuser:appuser static/ ./static/

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import os,sys,urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:' + os.environ['PORT'] + '/health').status == 200 else 1)" || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "exec gunicorn -w $WORKERS -b 0.0.0.0:$PORT main:app"]

LABEL org.opencontainers.image.title="speedtest" \
      org.opencontainers.image.description="Self-hosted internet speed test in a hardened Python container" \
      org.opencontainers.image.source="https://github.com/djlactose/speedtest" \
      org.opencontainers.image.licenses="MIT"
