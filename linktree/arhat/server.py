import http.server
import socketserver
import json
import os

# Load .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                os.environ[key.strip()] = value

# Change directory to 'public' to serve files from there
public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
if os.path.exists(public_dir):
    os.chdir(public_dir)

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/admin':
            self.send_response(301)
            self.send_header('Location', '/admin/')
            self.end_headers()
            return
            
        if self.path == '/admin/':
            self.path = '/admin/index.html'
        elif self.path == '/':
            self.path = '/index.html'
        elif self.path == '/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            timeout = os.environ.get('SESSION_TIMEOUT', '30')
            self.wfile.write(json.dumps({'sessionTimeout': int(timeout)}).encode('utf-8'))
            return
            
        return super().do_GET()

    def do_POST(self):
        if self.path == '/.netlify/functions/login':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                password = payload.get('password')
                admin_password = os.environ.get('ADMIN_PASSWORD')
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                if password == admin_password:
                    self.wfile.write(json.dumps({'success': True, 'message': 'Authenticated'}).encode('utf-8'))
                else:
                    self.wfile.write(json.dumps({'success': False, 'message': 'Invalid password'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        if self.path == '/save-data':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    raise ValueError("No content")
                    
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                site_data = payload.get('data')
                if not site_data:
                    raise ValueError("Missing data payload")

                file_content = json.dumps(site_data, indent=4)
                
                file_path = os.path.abspath('data.json')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'File saved successfully!'}).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
