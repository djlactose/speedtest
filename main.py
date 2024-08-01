from flask import Flask, request, send_file, jsonify, Response
import time
import os

app = Flask(__name__)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/download')
def download_file():
    file_path = '100MB.bin'
    def generate():
        with open(file_path, 'rb') as f:
            while chunk := f.read(4096):
                yield chunk
    return Response(generate(), headers={
        'Content-Disposition': 'attachment; filename=100MB.bin',
        'Content-Type': 'application/octet-stream'
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    start_time = time.time()
    file = request.files['file']
    file.save(os.path.join("/tmp", file.filename))
    end_time = time.time()
    duration = end_time - start_time
    return jsonify(duration=duration)

@app.route('/ping')
def ping():
    start_time = time.time()
    end_time = time.time()
    duration = end_time - start_time
    return jsonify(ping=duration)

@app.route('/jitter')
def jitter():
    start_time = time.time()
    jitter_values = []
    for _ in range(10):
        jitter_start = time.time()
        time.sleep(0.1)
        jitter_end = time.time()
        jitter_values.append(jitter_end - jitter_start)
    end_time = time.time()
    duration = end_time - start_time
    jitter = sum(jitter_values) / len(jitter_values)
    return jsonify(jitter=jitter, duration=duration)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
