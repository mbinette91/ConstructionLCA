#pragma strict

var ifcObjectContainer : GameObject;

function Start () {
	Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");
	this.ifcObjectContainer = GameObject.Find("IFCObjectContainer");

	//Tests:
	//this.SetTreeVisibility(this.ifcObjectContainer, "10100000000110000000000000000000000001101000000000000000".ToCharArray());
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

function SetTreeVisibility(gameObject : GameObject, bits : Array) {
	// Only leaves' visibility are set. Parents must be left alone, else all children will be affected.
	var components = new Array();
	for(var i = 0; i < gameObject.transform.childCount; i++) {
		var child : GameObject = gameObject.transform.GetChild(i).gameObject;
		var bit = bits.Shift();
		var status = (bit.Equals('1'[0]));
		if(child.transform.childCount == 0)
			child.renderer.enabled = status;
		SetTreeVisibility(child, bits);
	}
}

function HandleMessage(message : String) {
	var type = null;
	var params = [];
	var messageParts = message.Split('-'[0]);
	var messageType = messageParts[0];
	switch(messageType){
		case 'GetTree':
			type = "SetTree";
			params = GetTree(this.ifcObjectContainer);
			break;
		case 'SetTreeVisibility':
			var ifcObjectContainer : GameObject = GameObject.Find("IFCObjectContainer");
			if(messageParts.length > 1){
				var bits = messageParts[1].ToCharArray();
				SetTreeVisibility(this.ifcObjectContainer, bits);
			}
			break;
	}

	if(type){
		Application.ExternalCall("UnityFacade_HandleMessage", type, params);
	}
}