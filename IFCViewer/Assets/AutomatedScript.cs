#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;

class AutomatedScript
{
	static void PerformBuild ()
	{
		string[] args = System.Environment.GetCommandLineArgs();
		string id = "";

		for(int i=0; i < args.Length; i++) {
			if(args[i] == "-id"){
				id = args[i + 1];
				break;
			}
		}
		if(id == "")
			throw new System.Exception("You must define a build id! e.g. \"-id 9001\"");

		string buildName = "Build-"+id; //ARGS[1]
		string buildPath = buildName; //ARGS[1]
		string templateScenePath = "Assets/MainScene.unity"; //TemplateFile - No template file. project is a new project. + fixes the "one import then dies" issue. lolz. Delete the unity project once the unity3d file has been created? only keep the unity3d + the .obj (even then(??))
		string newScenePath = "Assets/"+buildName+".unity"; //Put scene in future build folder? build into that folder? same for assets? its getting a bit messy...
		//TO-DO? Copy project into his own path so that each impot = a new unity project ? Good idea. Else loading is going to take longer and longer...

		EditorApplication.OpenScene(templateScenePath);

		//string path = "Assets/Resources/AC14-FZK-Haus.ifc";
		//ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;  //ARGS[2] - save into /Resources/, put path into newAssetPath
		//AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate | ImportAssetOptions.Default);
		AssetDatabase.Refresh();


		GameObject container = GameObject.Find("IFCObjectContainer");
		GameObject go = GameObject.Instantiate(Resources.Load("AC14-FZK-Haus")) as GameObject; //Load newAssetPath
		go.transform.parent = container.transform;

		//Change shaders
		Shader shader = Shader.Find("Transparent/Diffuse");
		SetShader(go, shader);

		EditorApplication.SaveScene(newScenePath, true);

		string[] scenes = { newScenePath };
		BuildPipeline.BuildPlayer(scenes, buildPath, 
			BuildTarget.WebPlayer, BuildOptions.None);
	}

	static void SetShader(GameObject tree, Shader shader) {
		for(int i = 0; i < tree.transform.childCount; i++) {
			GameObject child  = tree.transform.GetChild(i).gameObject;
			if(child.renderer && child.renderer.material && child.renderer.material.shader) {
				child.renderer.material.shader = shader;
			}
			SetShader(child, shader);
		}
	}
}
#endif