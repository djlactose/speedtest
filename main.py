from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
import time
import random

# CORS Policy
class CORSRequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        BaseHTTPRequestHandler.end_headers(self)

class ThreadingSimpleServer(ThreadingMixIn, HTTPServer):
    pass

class PingHandler(CORSRequestHandler):
    def do_GET(self):
        if self.path == '/ping':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            delay = random.uniform(0.1, 1.0)
            time.sleep(delay)

            self.wfile.write(bytes("Ping response in " + str(delay) + " seconds", 'utf-8'))
            return

        self.send_error(404, 'Not Found')

if __name__ == '__main__':
    server = ThreadingSimpleServer(('localhost', 5000), PingHandler)
    server.serve_forever()
