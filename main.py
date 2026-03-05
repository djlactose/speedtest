from flask import Flask, request, send_from_directory, jsonify, Response, abort
import os, socket
from werkzeug.utils import secure_filename
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 150 * 1024 * 1024
DOWNLOAD_FILE = os.path.join(BASE_DIR, '100MB.bin')

limiter = Limiter(get_remote_address, app=app, default_limits=[])


@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/health')
@limiter.limit("60/minute")
def health():
    return jsonify(status="healthy")


@app.route('/download')
@limiter.limit("10/minute")
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
@limiter.limit("10/minute")
def upload_file():
    if 'file' not in request.files:
        return jsonify(error="No file part in request"), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error="No selected file"), 400
    filename = secure_filename(file.filename)
    if not filename:
        return jsonify(error="Invalid filename"), 400
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    try:
        os.remove(filepath)
    except OSError:
        pass
    return jsonify(status="ok")


@app.route('/ping')
@limiter.limit("60/minute")
def ping():
    return jsonify(status="ok", server=socket.gethostname())


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
