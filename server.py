import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = 'public'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print(f'Starting Samui Fair Price Index on port {PORT}...')
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'Serving at http://localhost:{PORT}')
    httpd.serve_forever()