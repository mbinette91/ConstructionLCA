import os
import subprocess
import shutil

class ModelBuilder:
	def __init__(self, model_id):
		self._model_id = str(int(model_id))
		if not self._model_id:
			exit();

	def build(self):
		model_id = self._model_id

		ROOT = os.path.dirname(os.path.realpath(__file__)).replace("\\", '/');
		TEMP = ROOT + "/tmp"

		temp_output_path = TEMP + "/output-" + model_id
		os.mkdir(temp_output_path);

		# Time to read the Ifc file!
		MEGABYTE = 1024 * 1024;
		subprocess.call('"'+ROOT+'/bin/IfcReader.exe" "'+(TEMP + "/IFC_" + model_id + ".ifc")+'" "'+temp_output_path+'" "'+ROOT+'/database.db3" '+str(5 * MEGABYTE))
		shutil.move(temp_output_path, ROOT + "/webapp/data/");

		# Keep the IFC file (?)

if __name__ == "__main__":
	import sys

	if len(sys.argv) != 2:
		print("Usage: ModelBuilder.py model_id");
		exit();

	model_id = sys.argv[1];
	builder = ModelBuilder(model_id);
	builder.build();