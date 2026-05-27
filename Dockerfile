# syntax=docker/dockerfile:1.7

# Pinned by digest for reproducibility and Docker Scout tracking.
# Refresh the digest periodically: `docker buildx imagetools inspect python:3.13-alpine`
ARG PYTHON_IMAGE=python:3.13-alpine@sha256:420cd0bf0f3998275875e02ecd5808168cf0843cbb4d3c536432f729247b2acc

FROM ${PYTHON_IMAGE} AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build

# Upgrade base + add toolchain for any C extensions without musllinux wheels.
RUN apk upgrade --no-cache \
 && apk add --no-cache --virtual .build-deps gcc musl-dev python3-dev libffi-dev

COPY requirements.lock ./
RUN pip install --prefix=/install --no-compile -r requirements.lock


FROM ${PYTHON_IMAGE} AS runtime

ARG APP_UID=1000
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    WORKERS=4 \
    PORT=8080 \
    TIMEOUT=300 \
    UPLOAD_FOLDER=/tmp

RUN apk upgrade --no-cache \
 && apk add --no-cache tini \
 && adduser -D -u ${APP_UID} appuser

WORKDIR /usr/src/app

COPY --from=builder /install /usr/local
COPY --chown=appuser:appuser main.py index.html 100MB.bin ./
COPY --chown=appuser:appuser static/ ./static/

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "exec gunicorn -w $WORKERS --timeout $TIMEOUT -b 0.0.0.0:$PORT main:app"]

LABEL org.opencontainers.image.title="speedtest" \
      org.opencontainers.image.description="Self-hosted internet speed test in a hardened Python container" \
      org.opencontainers.image.source="https://github.com/djlactose/speedtest" \
      org.opencontainers.image.licenses="MIT"
