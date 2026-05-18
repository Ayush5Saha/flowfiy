"""
Local HTTP server that receives base64 image POSTs from the browser and saves them to disk.
Run: python screenshot_server.py
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json, base64, os

SAVE_DIR = r"E:\CodeX Developemt\AI_Sales_outbound_system\ad-video\screenshots"
os.makedirs(SAVE_DIR, exist_ok=True)

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        length = int(self.headers['Content-Length'])
        body = self.rfile.read(length)
        data = json.loads(body)
        name = data['name']
        b64 = data['data']
        path = os.path.join(SAVE_DIR, f"{name}.jpg")
        with open(path, 'wb') as f:
            f.write(base64.b64decode(b64))
        size_kb = os.path.getsize(path) // 1024
        print(f"  Saved {name}.jpg ({size_kb} KB)")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'ok': True, 'path': path}).encode())

    def log_message(self, *args): pass  # silence request logs

print("Screenshot server running on http://localhost:9999")
HTTPServer(('localhost', 9999), Handler).serve_forever()
