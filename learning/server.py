import http.server
import socketserver
import json
import os

PORT = 8000
# Set directory to the folder containing this script (learning/)
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Redirect /admin to /admin/ (trailing slash) to fix relative paths
        if self.path == '/admin':
            self.send_response(301)
            self.send_header('Location', '/admin/')
            self.end_headers()
            return
            
        # Serve index.html for /admin/ explicitly if needed, or let default handler work
        if self.path == '/admin/':
            self.path = '/admin/index.html'
        elif self.path == '/':
            self.path = '/index.html'
            
        return super().do_GET()

    def do_POST(self):
        if self.path == '/save-data':
            print("Received save request...")
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    raise ValueError("No content received")
                    
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Format as JS file
                file_content = f"const siteData = {json.dumps(data, indent=4)};"
                
                # Save to assets/js/data.js (relative to served directory 'public')
                file_path = os.path.abspath(os.path.join('assets', 'js', 'data.js'))
                
                print(f"Attempting to save to: {file_path}")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                
                print("File written successfully.")
                
                # Only send 200 if we got here
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'File saved successfully!'}).encode('utf-8'))
                print("Response sent.")
                
            except Exception as e:
                print(f"Error processing request: {e}")
                import traceback
                traceback.print_exc()
                # Only send 500 if we haven't sent headers yet (approximate check)
                try:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode('utf-8'))
                except Exception as send_err:
                    print(f"Could not send error response: {send_err}")
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
