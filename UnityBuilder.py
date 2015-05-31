import os
import subprocess
import shutil

class UnityBuilder:
	def __init__(self, model_id):
		self._model_id = str(int(model_id))
		if not self._model_id:
			exit();

	def build(self):
		model_id = self._model_id

		ROOT = os.path.dirname(os.path.realpath(__file__)).replace("\\", '/');
		TEMP = ROOT + "/tmp"

		template_project_path = ROOT + "/IFCViewer"
		new_project_path = TEMP + "/Unity_"+model_id

		# Copy template project
		try:
		    shutil.copytree(template_project_path, new_project_path)
		except shutil.Error as e:
		    print('Directory not copied. Error: %s' % e)
		    exit();
		except OSError as e:
		    print('Directory not copied. Error: %s' % e)
		    exit();

		# Copy IFC file
		shutil.copyfile(TEMP + "/IFC_" + model_id + ".ifc", new_project_path + "/Assets/Resources/IFC_" + model_id + ".ifc");

		# Let the Unity Editor do it's work...
		subprocess.call('"C:\Program Files (x86)\Unity\Editor\Unity.exe" -batchmode -quit -executeMethod AutomatedScript.PerformBuild -id "'+model_id+'" -projectPath "' + new_project_path + '"')

		# Copy the new unity build into the builds folder
		shutil.copyfile(new_project_path+"/Build-"+model_id+"/Build-"+model_id+".unity3d", ROOT + "/webapp/UnityBuilds/Build-"+model_id+".unity3d");

		# Delete the temp project Directory
		shutil.rmtree(new_project_path);

		# Keep the IFC file (?)

if __name__ == "__main__":
	import sys

	if len(sys.argv) != 2:
		print("Usage: UnityBuilder.py model_id");
		exit();

	model_id = sys.argv[1];
	builder = UnityBuilder(model_id);
	builder.build();