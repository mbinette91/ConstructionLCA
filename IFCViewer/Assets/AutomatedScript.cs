#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;

class AutomatedScript
{
	private static string GetBuildID() 
	{
		string[] args = System.Environment.GetCommandLineArgs();

		for(int i=0; i < args.Length; i++) {
			if(args[i] == "-id"){
				return args[i + 1];
			}
		}

		throw new System.Exception("You must define a build id! e.g. \"-id 9001\"");
	}

	static void PerformBuild ()
	{
		string id = GetBuildID();
		string buildName = "Build-"+id; //ARGS[1]
		string buildPath = buildName; //ARGS[1]
		string templateScenePath = "Assets/MainScene.unity"; //TemplateFile - No template file. project is a new project. + fixes the "one import then dies" issue. lolz. Delete the unity project once the unity3d file has been created? only keep the unity3d + the .obj (even then(??))
		string newScenePath = "Assets/" + buildName + ".unity"; //Put scene in future build folder? build into that folder? same for assets? its getting a bit messy...
		//TO-DO? Copy project into his own path so that each impot = a new unity project ? Good idea. Else loading is going to take longer and longer...

		EditorApplication.OpenScene(templateScenePath);

		//string path = "Assets/Resources/AC14-FZK-Haus.ifc";
		//ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;  //ARGS[2] - save into /Resources/, put path into newAssetPath
		//AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate | ImportAssetOptions.Default);
		AssetDatabase.Refresh();

		// Add the new IFC Model to the scene
		GameObject container = GameObject.Find("IFCObjectContainer");
		GameObject IFCGameObject = GameObject.Instantiate(Resources.Load("IFC_" + id)) as GameObject;
		DestroyAllChilds(container);
		IFCGameObject.transform.parent = container.transform;

		// Process new IFC Model
		IFCProcessor processor = new IFCProcessor();
		processor.Process(IFCGameObject);

		EditorApplication.SaveScene(newScenePath, true);

		string[] scenes = { newScenePath };
		BuildPipeline.BuildPlayer(scenes, buildPath, 
			BuildTarget.WebPlayer, BuildOptions.None);
	}

	private static void DestroyAllChilds(GameObject gameObject) 
	{
		int childs = gameObject.transform.childCount;
		for (int i = childs - 1; i >= 0; i--)
			GameObject.DestroyImmediate(gameObject.transform.GetChild(i).gameObject);
	}
}
#endif