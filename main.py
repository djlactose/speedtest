from flask import Flask, jsonify
from datetime import datetime
import time
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)

@app.route('/ping')
def ping():
    return 'pong'

@app.route('/jitter')
def jitter():
    # Send 10 packets and calculate the jitter
    total_jitter = 0
    for i in range(50):
        start_time = time.time()
        response = app.test_client().get('/ping')
        end_time = time.time()
        elapsed_time = end_time - start_time
        total_jitter += elapsed_time

    # Calculate the average jitter and return it as a JSON object
    avg_jitter = total_jitter / 50 * 1000
    response = jsonify(jitter=avg_jitter)
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.route('/upload', methods=['POST'])
def upload():
    # Receive the file and don't save it
    file = request.files['file']
    return jsonify(message="Upload successful")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)