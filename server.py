import http.server as srv

PORT = 8000

handler = srv.SimpleHTTPRequestHandler
httpd = srv.HTTPServer(("", PORT), handler)
httpd.serve_forever()
