#pragma strict

var ifcObjectContainer : GameObject;
var modelMiddlePoint : Vector3 = new Vector3(-3,3,-2);
var distanceCamFocus : float = 5;

function Start () {
	Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");
	this.ifcObjectContainer = GameObject.Find("IFCObjectContainer");
	ResetObjectStyle(this.ifcObjectContainer);

	//Tests:
	//this.SetTreeVisibility(this.ifcObjectContainer, "10100000000110000000000000000000000001101000000000000000".ToCharArray());
	//this.FocusOnObject(this.ifcObjectContainer, 19);
}

function Update () {

}

function GetTree(tree : GameObject) : Array {
	// Structure: Node: [nodeName, [childNode, ...]], params: [Node, ...]
	var components = new Array();
	for(var i = 0; i < tree.transform.childCount; i++) {
		var node = new Array();
		var child : GameObject = tree.transform.GetChild(i).gameObject;
		node.Push(child.name);
		node.Push(GetTree(child));
		components.Push(node);
	}
	return components;
}

function ResetObjectStyle(tree : GameObject) : void {
	for(var i = 0; i < tree.transform.childCount; i++) {
		var child : GameObject = tree.transform.GetChild(i).gameObject;
		if(child.renderer){
			child.renderer.enabled = true;
			child.renderer.material.color.r = 1.0;
			child.renderer.material.color.g = 1.0;
			child.renderer.material.color.b = 1.0;
			child.renderer.material.color.a = 1.0;
		}
		ResetObjectStyle(child);
	}
}

function FocusOnObject(tree : GameObject, id : int) : void {
	for(var i = 0; i < tree.transform.childCount; i++) {
		var child : GameObject = tree.transform.GetChild(i).gameObject;
		if(child.renderer){
			if(child.transform.childCount == 0) {
				if(id != 0){
					child.renderer.material.color.r = 1.0;
					child.renderer.material.color.g = 1.0;
					child.renderer.material.color.b = 1.0;
					child.renderer.material.color.a = Mathf.Min(child.renderer.material.color.a, 0.9);
				}
				else {
					child.renderer.material.color.r = 0.5;
					child.renderer.material.color.g = 1.0;
					child.renderer.material.color.b = 1.0;
					child.renderer.material.color.a = 1.0;
					var cam : Camera = Camera.main;
					var camPosition : Vector3 = modelMiddlePoint; //Start from the middle
					var goPosition : Vector3 = child.transform.position;
					//Trying to find the best point of the object to focus on
					//TO-DO: This can be greatly improved with a nice alg to find the center point.
					var meshFilter : MeshFilter = child.GetComponent(MeshFilter);
					if(meshFilter.mesh.vertices) {
						goPosition = meshFilter.mesh.vertices[0];
					}
					var newCamPosition = (camPosition - goPosition).normalized * this.distanceCamFocus;
					camPosition = newCamPosition;
					cam.transform.position = goPosition + newCamPosition; //TO-DO: Get rid of this little magic.
					cam.transform.LookAt(goPosition);
					var hits : RaycastHit[];
					hits = Physics.SphereCastAll(goPosition, 3.0f, (camPosition - goPosition));
					for(var j = 0; j < hits.Length; j++) { 
						var gameObject : GameObject = hits[j].transform.gameObject;
						Debug.Log(gameObject);
						if(gameObject != child) {
							gameObject.renderer.material.color.a = Mathf.Min(gameObject.renderer.material.color.a, 0.1);
						}
					}
				}
			}
		}
		id--;
		FocusOnObject(child, id);
	}
}

function SetTreeVisibility(tree : GameObject, bits : Array) {
	// Only leaves' visibility are set. Parents must be left alone, else all children will be affected.
	var components = new Array();
	for(var i = 0; i < tree.transform.childCount; i++) {
		var child : GameObject = tree.transform.GetChild(i).gameObject;
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
			if(messageParts.length > 1){
				var bits = messageParts[1].ToCharArray();
				SetTreeVisibility(this.ifcObjectContainer, bits);
			}
			break;
		case 'FocusOnObject':
			if(messageParts.length > 1){
				var id = int.Parse(messageParts[1]);
				ResetObjectStyle(this.ifcObjectContainer);
				FocusOnObject(this.ifcObjectContainer, id);
			}
			break;
	}

	if(type){
		Application.ExternalCall("UnityFacade_HandleMessage", type, params);
	}
}