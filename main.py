from flask import Flask, jsonify
from datetime import datetime
import time
from flask_cors import CORS

app = Flask(__name__)
app.config['CORS_ALLOWED_ORIGINS'] = '*'
CORS(app)

@app.route('/ping')
def ping():
    return 'pong'

@app.route('/jitter')
def jitter():
    # Send 10 packets and calculate the jitter
    total_jitter = 0
    for i in range(10):
        start_time = time.time()
        response = app.test_client().get('/ping')
        end_time = time.time()
        elapsed_time = end_time - start_time
        total_jitter += elapsed_time

    # Calculate the average jitter and return it as a JSON object
    avg_jitter = total_jitter / 10 * 1000
    return jsonify(jitter=avg_jitter)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
