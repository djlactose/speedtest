from flask import Flask, request, send_from_directory, jsonify, Response, abort
import time, os
from werkzeug.utils import secure_filename

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
DOWNLOAD_FILE = os.path.join(BASE_DIR, '100MB.bin')

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/download')
def download_file():
    if not os.path.exists(DOWNLOAD_FILE):
        abort(404, description="Download file not found")
    def generate():
        with open(DOWNLOAD_FILE, 'rb') as f:
            while (chunk := f.read(4096)):
                yield chunk
    return Response(generate(), headers={
        'Content-Disposition': 'attachment; filename=100MB.bin',
        'Content-Type': 'application/octet-stream'
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify(error="No file part in request"), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error="No selected file"), 400
    filename = secure_filename(file.filename)
    start_time = time.time()
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    end_time = time.time()
    duration = end_time - start_time
    return jsonify(duration=duration)

@app.route('/ping')
def ping():
    # This endpoint just returns a minimal value
    start_time = time.time()
    end_time = time.time()
    duration = end_time - start_time
    return jsonify(ping=duration)

@app.route('/jitter')
def jitter():
    jitter_values = []
    for _ in range(10):
        jitter_start = time.time()
        time.sleep(0.1)
        jitter_end = time.time()
        jitter_values.append(jitter_end - jitter_start)
    jitter_avg = sum(jitter_values) / len(jitter_values)
    return jsonify(jitter=jitter_avg, iterations=10)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
