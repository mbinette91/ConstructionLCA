import os
import threading
import urlparse
import time
from SimpleHTTPServer import SimpleHTTPRequestHandler
from ModelBuilder import ModelBuilder
import pickle

db = None;
def GetUniqueProjectId():
	global db
	filename = "../temp.db"

	if not db:
		db = {'last_project_id': 0}
		if os.path.isfile(filename):
			file = open(filename, 'r')
			db = pickle.load(file)
			file.close()

	db['last_project_id'] += 1

	file = open(filename, 'w')
	pickle.dump(db, file);
	file.close()

	return db['last_project_id']

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
	def do_GET(self):
		url = urlparse.urlparse(self.path)
		params = urlparse.parse_qs(url.query)

		if url.path == "/project":
			self.show_project(params)
		else: # Default
			SimpleHTTPRequestHandler.do_GET(self);

	def show_project(self, query):
		print "Requesting /project with", query
		if 'id' not in query:
			self.send_response(302)
			self.send_header('Location', '/')
			self.end_headers()
			return;

		with open("_project.html") as f:
			response = f.read().replace('{PROJECT_ID}', query['id'][0])
			self.send_response(200)
			self.send_header("Content-type", "text/html")
			self.send_header("Content-length", len(response))
			self.end_headers()
			self.wfile.write(response)

	def do_POST(self):
		url = urlparse.urlparse(self.path)
		params = urlparse.parse_qs(url.query)

		if url.path == "/project":
			self.new_project(params)
		else: # Default
			SimpleHTTPRequestHandler.do_POST(self);

	def new_project(self, query):
		id = str(GetUniqueProjectId());

		print "Creating new project with id =", id
		result = self._upload_ifc(id)

		if result[0]:
			thread = threading.Thread(target = self._build_unity, args = (id,)) # Start in a new thread
			thread.start();
			self.send_response(302)
			self.send_header('Location', '/project?id='+id)
			self.end_headers()
		else: # For debugging purposes only
			print result;
			self.send_response(302)
			self.send_header('Location', '/?error='+result[1])
			self.end_headers()

	def _build_unity(self, model_id):
		# This method can take a long time and should NOT be called from the main HTTPHandler's thread.
		start_time = time.time()
		builder = ModelBuilder(model_id);
		builder.build();

	def _upload_ifc(self, id):
		# Inspired by https://gist.github.com/UniIsland/3346170
		boundary = self.headers.plisttext.split("=")[1]
		remainbytes = int(self.headers['content-length'])
		line = self.rfile.readline()
		remainbytes -= len(line)
		if not boundary in line:
			return (False, "Content NOT begin with boundary")
		line = self.rfile.readline()
		remainbytes -= len(line)

		fn = "../tmp/IFC_" + id + ".ifc"
		line = self.rfile.readline()
		remainbytes -= len(line)
		line = self.rfile.readline()
		remainbytes -= len(line)
		try:
			out = open(fn, 'wb')
		except IOError:
			return (False, "Can't create file to write, do you have permission to write?")
				
		preline = self.rfile.readline()
		remainbytes -= len(preline)
		while remainbytes > 0:
			line = self.rfile.readline()
			remainbytes -= len(line)
			if boundary in line:
				preline = preline[0:-1]
				if preline.endswith('\r'):
					preline = preline[0:-1]
				out.write(preline)
				out.close()
				return (True, "File '%s' upload success!" % fn)
			else:
				out.write(preline)
				preline = line
		return (False, "Unexpect Ends of data.")

if __name__ == "__main__":
	import sys
	import BaseHTTPServer
	
	os.chdir('webapp/')

	HandlerClass = CustomHTTPRequestHandler
	ServerClass  = BaseHTTPServer.HTTPServer
	Protocol	 = "HTTP/1.0"

	port = 8000
	server_address = ('127.0.0.1', port)

	HandlerClass.protocol_version = Protocol
	httpd = ServerClass(server_address, HandlerClass)

	sa = httpd.socket.getsockname()
	print "Serving HTTP on", sa[0], "port", sa[1], "..."
	httpd.serve_forever()