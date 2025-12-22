import http.server
import socketserver
import json
import os

PORT = 8000
# Set directory to the folder containing this script (learning/)
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Redirect /admin to /admin/index.html for convenience
        if self.path == '/admin':
            self.path = '/admin/index.html'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/save-data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                # Format as JS file
                file_content = f"const siteData = {json.dumps(data, indent=4)};"
                
                # Save to public/assets/js/data.js
                file_path = os.path.join(DIRECTORY, 'public', 'assets', 'js', 'data.js')
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'File saved successfully!'}).encode('utf-8'))
                print(f"Data saved to {file_path}")
            except Exception as e:
                print(f"Error saving file: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "File not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Ensure we serve from the public directory
PUBLIC_DIR = os.path.join(DIRECTORY, 'public')
os.chdir(PUBLIC_DIR)

print(f"Server running at http://localhost:{PORT}/admin/")
print(f"Serving directory: {PUBLIC_DIR}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
