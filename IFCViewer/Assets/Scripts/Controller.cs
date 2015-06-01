using UnityEngine;
using System.Collections;

public class Controller : MonoBehaviour
{
	// Make sure that the Controller ScriptExecution is set to first priority! (Edit > Project Settings > Script Execution) 
	// This will assure that the other's script's Awake can use Controller.main;
	public static Controller main = null;
	public GameObject ifcObjectContainer;
	public CameraFocus focus;
	public IFCRenderer ifcRenderer;

	private Camera cam;

	void Awake ()
	{
		// Set your public attributes first, so other classes can use them.
		if(Controller.main == null)
			Controller.main = this;
		else
			throw new System.Exception("There can only be one Controller per project!");

		cam = Camera.main;

		if(ifcObjectContainer == null)
			ifcObjectContainer = GameObject.Find("IFCObjectContainer");
		if(focus == null)
			focus = cam.GetComponent<CameraFocus>();
		if(ifcRenderer == null)
			ifcRenderer = this.GetComponent<IFCRenderer>();
	}

	void Start ()
	{
		ifcRenderer.Reset();

		Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");

		//Tests:
		//this.SetTreeVisibility(this.ifcObjectContainer, "10100000000110000000000000000000000001101000000000000000");
		focus.Focus(GetGameObjectById(this.ifcObjectContainer, "ID_24"));
	}

	ArrayList GetTree(GameObject tree) {
		// Structure: Node: [nodeId, nodeName, [childNode, ...]], params: [Node, ...]
		var components = new ArrayList();
		for(var i = 0; i < tree.transform.childCount; i++)
		{
			var node = new ArrayList();
			GameObject child = tree.transform.GetChild(i).gameObject;
			node.Add(child.ifc().id);
			node.Add(child.name);
			node.Add(GetTree(child));
			components.Add(node);
		}
		return components;
	}

	GameObject GetGameObjectById(GameObject tree, string id)
	{
		for(var i = 0; i < tree.transform.childCount; i++) 
		{
			GameObject child = tree.transform.GetChild(i).gameObject;
			if(id == child.ifc().id)
			{
				return child;
			}

			GameObject go = GetGameObjectById(child, id);
			if(go)
				return go;
		}

		return null; // Not found!
	}

	string SetTreeVisibility(GameObject tree, string bits) {
		// Returns new bits
		// Only leaves' visibility are set. Parents must be left alone, else all children will be affected.
		for(var i = 0; i < tree.transform.childCount; i++)
		{
			GameObject child = tree.transform.GetChild(i).gameObject;
			var status = bits[0] == '1';
			if(child.transform.childCount == 0)
				child.renderer.enabled = status;
			bits = SetTreeVisibility(child, bits.Substring(1));
		}
		return bits;
	}

	void HandleMessage(string message)
	{
		string type = null;
		var args = new ArrayList();
		var messageParts = message.Split('-');
		var messageType = messageParts[0];
		switch(messageType)
		{
			case "GetTree":
				type = "SetTree";
				args = GetTree(this.ifcObjectContainer);
				break;
			case "SetTreeVisibility":
				if(messageParts.Length > 1)
				{
					SetTreeVisibility(this.ifcObjectContainer, messageParts[1]);
				}
				break;
			case "FocusOnObject":
				if(messageParts.Length > 1)
				{
					var id = messageParts[1];
					ifcRenderer.Reset();
					focus.Focus(GetGameObjectById(this.ifcObjectContainer, id));
				}
				break;
		}

		if(type != null){
			Application.ExternalCall("UnityFacade_HandleMessage", type, args);
		}
	}
}