# Speedtest

A self-hosted internet speed test application you can run in a Docker container. Tests download speed, upload speed, ping latency, and jitter from your browser.

## Features

- **Download test** — Streams a 100MB file and measures throughput
- **Upload test** — Uploads a 99MB blob with real-time progress tracking
- **Ping test** — Measures round-trip latency to the server in milliseconds
- **Jitter test** — Computes variation across multiple ping samples
- **Test All** — Runs all four tests sequentially with a single click
- Cancel any running test mid-flight
- Dark dashboard UI with color-coded results (excellent/good/fair/poor)
- Copy results to clipboard
- Server hostname display
- Responsive layout for desktop and mobile
- Rate limiting and security headers

## Quick Start

```bash
docker build -t speedtest .
docker run -d -p 80:80 speedtest
```

Then open `http://localhost` in your browser.

## Tech Stack

- **Backend:** Python 3.12, Flask, Gunicorn, Flask-Limiter
- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks)
- **Container:** Docker (python:3.12-slim, non-root user)

## API Endpoints

| Endpoint    | Method | Description                                        |
| ----------- | ------ | -------------------------------------------------- |
| `/`         | GET    | Serves the web UI                                  |
| `/download` | GET    | Streams the 100MB test file (10 req/min)           |
| `/upload`   | POST   | Accepts a file upload, max 150MB (10 req/min)      |
| `/ping`     | GET    | Returns server hostname for latency measurement    |
| `/health`   | GET    | Health check endpoint for container orchestration  |

## Security

- Non-root container user
- Upload size limit (150MB)
- Uploaded test files are deleted immediately after saving
- Rate limiting on all endpoints
- Security headers: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## License

MIT — see [LICENSE](LICENSE) for details.

## Author

Written by Nick Hernandez — [GitHub](https://github.com/djlactose/speedtest)
