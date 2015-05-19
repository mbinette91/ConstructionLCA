#pragma strict

function Start () {
	Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");
}

function Update () {

}

function GetTree(gameObject : GameObject) : Array {
	// Structure: Node: [nodeName, [childNode, ...]], params: [Node, ...]
	var components = new Array();
	for(var i = 0; i < gameObject.transform.childCount; i++) {
		var node = new Array();
		var child : GameObject = gameObject.transform.GetChild(i).gameObject;
		node.Push(child.name);
		node.Push(GetTree(child));
		components.Push(node);
	}
	return components;
}

function HandleMessage(message : String) {
	var type = "";
	var params = [];
	switch(message){
		case 'GetTree':
			var ifcObjectContainer : GameObject = GameObject.Find("IFCObjectContainer");
			type = "SetTree";
			params = GetTree(ifcObjectContainer);
			break;
	}

	Application.ExternalCall("UnityFacade_HandleMessage", type, params);
}