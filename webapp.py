import os
import threading
import urlparse
import time
from SimpleHTTPServer import SimpleHTTPRequestHandler
from ModelBuilder import ModelBuilder
import pickle
import sqlite3
import json

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

class ProductTreeBuilder:
	IGNORED_CLASSES = ["Building", "BuildingStorey", "Space"]

	def __init__(self):
		self.data = []
		self.last_class_name = None;
		self.class_data = []
		self.last_class_type = None;
		self.class_type_data = [];
		self.undefined_data = [];

	def add_product_row(self, row):
		class_name = row[2].replace("Ifc", "");
		if class_name in ProductTreeBuilder.IGNORED_CLASSES:
			return;
		type = row[3];
		product_data = [row[0], row[1]];
		if class_name != self.last_class_name:
			self.close_class();
			self.last_class_name = class_name;

		if not type:
			self.undefined_data.append(product_data)
		else:
			if type != self.last_class_type:
				self.close_class_type();
				self.last_class_type = type;
			self.class_type_data.append(product_data)

	def close_class_type(self):
		if len(self.class_type_data) != 0:
			self.class_data.append([self.last_class_type, self.class_type_data]);
			self.class_type_data = [];
		self.last_class_type = None;

	def close_undefined_type(self):
		if len(self.undefined_data) != 0:
			self.class_data.append(["Others", self.undefined_data]);
			self.undefined_data = []

	def close_class(self):
		self.close_class_type();
		self.close_undefined_type();
		if len(self.class_data) != 0:
			self.data.append([self.last_class_name, self.class_data]);
			self.class_data = []
		self.last_class_name = None;

	def end(self):
		self.close_class();

	def get_tree(self):
		return self.data;

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
	def do_GET(self):
		url = urlparse.urlparse(self.path)
		params = urlparse.parse_qs(url.query)

		if url.path == "/project":
			self.show_project(params)
		if url.path == "/project/info":
			self.get_project_info(params)
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

	def get_project_info(self, query):
		print "Requesting /project/info with", query
		if 'id' not in query or 'get' not in query:
			self.send_response(302)
			self.send_header('Location', '/')
			self.end_headers()
			return;

		if query['get'][0] == 'tree':
			conn = sqlite3.connect('../database.db3')
			conn.text_factory = str
			c = conn.cursor()
			c.execute('SELECT p.guid, p.name, p.class_name, m.name FROM products p LEFT JOIN materials m ON p.id=m.product_id WHERE project_id=? ORDER BY p.class_name, m.name', (query['id'][0],))
			
			builder = ProductTreeBuilder();
			for row in c.fetchall():
				builder.add_product_row(row);
			builder.end();

			self.send_response(200)
			self.send_header("Content-type", "text/html")
			self.end_headers()
			self.wfile.write(json.dumps(builder.get_tree(), encoding='latin1'))
			return;
		elif query['get'][0] == 'info':
			conn = sqlite3.connect('../database.db3')
			conn.text_factory = str
			c = conn.cursor()
			c.execute('SELECT guid,p.name,description,class_name,m.name,m.thickness,m.layer_name FROM products p LEFT JOIN materials m ON p.id=m.product_id WHERE project_id=?', (query['id'][0],))
			
			data = []
			for row in c.fetchall():
				data.append({
						'guid': row[0], 
						'name': row[1], 
						'description': row[2], 
						'className': row[3], 
						'material': {'name': row[4], 'thickness': row[5], 'layerName': row[6]}
					})

			self.send_response(200)
			self.send_header("Content-type", "text/html")
			self.end_headers()
			self.wfile.write(json.dumps(data, encoding='latin1'))
			return;
		elif query['get'][0] == 'properties':
			conn = sqlite3.connect('../database.db3')
			conn.text_factory = str
			c = conn.cursor()
			c.execute('SELECT ps.id, ps.name FROM products p LEFT JOIN property_set ps ON p.id=ps.product_id WHERE project_id=? AND p.guid=?', (query['id'][0],query['product_id'][0],))
			
			data = []
			for row in c.fetchall():
				properties = []
				c2 = conn.cursor()
				c2.execute('SELECT p.name, p.value FROM property p WHERE property_set_id=?', (row[0],))
				for prop_row in c2.fetchall():
					properties.append({
							'name': prop_row[0],
							'value': prop_row[1]
						})
				data.append({
						'name': row[1],
						'properties': properties
					})
				c2.close();

			self.send_response(200)
			self.send_header("Content-type", "text/html")
			self.end_headers()
			self.wfile.write(json.dumps(data, encoding='latin1'))
			return;

	def get_tree(self, query):
		print "Requesting /project/tree with", query
		if 'id' not in query:
			self.send_response(302)
			self.send_header('Location', '/')
			self.end_headers()
			return;

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