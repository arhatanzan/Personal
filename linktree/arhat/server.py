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
root_dir = os.path.dirname(os.path.abspath(__file__))
# Prefer `dist` (Vite build output). Fall back to `public` for legacy assets.
dist_dir = os.path.join(root_dir, 'dist')
public_dir = os.path.join(root_dir, 'public')

# Prefer `dist` (Vite build output). Fall back to `public`.
if os.path.exists(dist_dir):
    os.chdir(dist_dir)
# Use public only if it has an index.html (typical build/public site)
elif os.path.exists(public_dir) and os.path.exists(os.path.join(public_dir, 'index.html')):
    os.chdir(public_dir)
# If repo root has an index.html (e.g., legacy reference or standalone index), use it
elif os.path.exists(os.path.join(root_dir, 'index.html')):
    os.chdir(root_dir)
# Otherwise, fall back to public if it exists (even without index.html)
elif os.path.exists(public_dir):
    os.chdir(public_dir)
else:
    os.chdir(root_dir)

# Detect unbuilt React source presence so we can show a helpful message instead of serving JSX directly
has_dist = os.path.exists(dist_dir)
has_unbuilt_react = (not has_dist) and os.path.exists(os.path.join(root_dir, 'src', 'main.jsx'))

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # If requesting the config API, return JSON directly
        if self.path == '/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            timeout = os.environ.get('SESSION_TIMEOUT', '30')
            self.wfile.write(json.dumps({'sessionTimeout': int(timeout)}).encode('utf-8'))
            return

        # Let function/API routes be served as files (or 404 by default handler)
        if self.path.startswith('/.netlify/functions'):
            return super().do_GET()

        # For all other GET requests: if the file exists on disk, serve it; otherwise serve index.html
        request_path = self.path.split('?', 1)[0].split('#', 1)[0]
        fs_path = request_path.lstrip('/') or 'index.html'
        # If developer hasn't built the React app (unbuilt JSX present and no dist),
        # avoid serving the raw `index.html` that references `/src/main.jsx` (which causes blank page).
        if globals().get('has_unbuilt_react'):
            # If the request would serve index.html (root or missing file), return a helpful message.
            if fs_path == 'index.html' or not os.path.exists(fs_path):
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                msg = """
                <!doctype html>
                <html>
                <head><meta charset='utf-8'><title>App not built</title></head>
                <body style='font-family:system-ui,Segoe UI,Roboto,Arial;margin:40px'>
                <h2>React app is not built</h2>
                <p>The development build references source files (src/) and requires Vite to run.</p>
                <p>To run locally, open a terminal and run:</p>
                <pre>npm install
npm run dev</pre>
                <p>Or to create a production build then serve it with this Python server:</p>
                <pre>npm install
npm run build
# then restart this server</pre>
                </body></html>
                """
                self.wfile.write(msg.encode('utf-8'))
                return

        # If requested resource exists, serve it. Otherwise, serve SPA entry (index.html)
        if not os.path.exists(fs_path):
            self.path = '/index.html'

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
