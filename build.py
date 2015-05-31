import os
import subprocess
import shutil

project_id = '123'

TEMP = os.getcwd().replace("\\", '/') + "/tmp"

template_project_path = "IFCViewer"
new_project_path = TEMP + "/Unity_"+project_id

try:
    shutil.copytree(template_project_path, new_project_path)
except shutil.Error as e:
    print('Directory not copied. Error: %s' % e)
    exit();
except OSError as e:
    print('Directory not copied. Error: %s' % e)
    exit();

# MAKE SURE TO SANITIZE USER INPUT. COMMAND INJECTION POSSIBLE HERE (???)
subprocess.call('"C:\Program Files (x86)\Unity\Editor\Unity.exe" -batchmode -quit -executeMethod AutomatedScript.PerformBuild -id "'+project_id+'" -projectPath "' + new_project_path + '"')

# Copy the new unity build into the builds folder
shutil.copyfile(new_project_path+"/Build-"+project_id+"/Build-"+project_id+".unity3d", "webapp/UnityBuilds/Build-"+project_id+".unity3d");

# Delete the temp project Directory
shutil.rmtree(new_project_path);