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
- Responsive layout for desktop and mobile

## Quick Start

### Docker

```bash
docker build -t speedtest .
docker run -d -p 80:80 speedtest
```

Then open `http://localhost` in your browser.

## Tech Stack

- **Backend:** Python, Flask, Gunicorn
- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks)
- **Container:** Docker (Python 3.9-slim)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the web UI |
| `/download` | GET | Streams the 100MB test file |
| `/upload` | POST | Accepts a file upload, returns duration |
| `/ping` | GET | Returns a minimal JSON response for latency measurement |
| `/jitter` | GET | Returns jitter measurement |

## License

MIT — see [LICENSE](LICENSE) for details.

## Author

Written by Nick Hernandez — [GitHub](https://github.com/djlactose/speedtest)
