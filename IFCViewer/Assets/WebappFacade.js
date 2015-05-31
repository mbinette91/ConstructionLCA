#pragma strict

var ifcObjectContainer : GameObject;
private var lastClickTime : float = 0;
private var catchTime : float = 0.25;
private var modelMiddlePoint : Vector3 = new Vector3(-3,6,-2);
private var distanceCamFocus : float = 5;

enum FocusStatus { Default, Custom, None };
var focusStatus : FocusStatus;

function Start () {
	Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");
	this.ifcObjectContainer = GameObject.Find("IFCObjectContainer");
	ResetObjectStyle(this.ifcObjectContainer);

	//Tests:
	//this.SetTreeVisibility(this.ifcObjectContainer, "10100000000110000000000000000000000001101000000000000000".ToCharArray());
	//this.FocusOnObject(this.ifcObjectContainer, GetGameObjectById(this.ifcObjectContainer, 19));
}

function Update () {
	if(Input.GetButtonDown("Fire1")){
		if(Time.time - lastClickTime < catchTime){
			var ray : Ray = Camera.main.ScreenPointToRay(Input.mousePosition);
			//Debug.DrawRay(ray.origin, 10*ray.direction, Color.red, 100, true);
			var hit : RaycastHit;
			if (Physics.Raycast(ray, hit)) {
				ResetObjectStyle(this.ifcObjectContainer);
				this.FocusOnObject(this.ifcObjectContainer, hit.transform.gameObject);
			}
		}
		lastClickTime = Time.time;
	}
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
		if(child.collider){
			child.collider.enabled = true;
		}
		if(child.renderer){
			child.renderer.enabled = true;
			SetRendererRGBA(child.renderer, 1, 1, 1, 1);
		}
		ResetObjectStyle(child);
	}
}

function SetRendererRGBA(renderer : Renderer, r: float, g : float, b : float, a : float){
	for(var j = 0; j < renderer.materials.Length; j++) {
		var material : Material = renderer.materials[j];
		material.color.r = r;
		material.color.g = g;
		material.color.b = b;
		material.color.a = a;
	}
}

function GetGameObjectById(tree : GameObject, id : int) : GameObject {
	for(var i = 0; i < tree.transform.childCount; i++) {
		var child : GameObject = tree.transform.GetChild(i).gameObject;
		if(id == 0) {
			Debug.Log(child);
			return child;
		}

		id--;
		var go : GameObject = GetGameObjectById(child, id);
		if(go)
			return go;
	}

	return null; //Not found!
}

function FocusOnObject(tree : GameObject, gameObject : GameObject) : void {
	for(var i = 0; i < tree.transform.childCount; i++) {
		var child : GameObject = tree.transform.GetChild(i).gameObject;
		if(child.renderer){
			if(child.transform.childCount == 0) {
				if(child != gameObject){
					SetRendererRGBA(child.renderer, 1, 1, 1, Mathf.Min(child.renderer.material.color.a, 0.9));
				}
				else {
					SetRendererRGBA(child.renderer, 0.5, 1, 1, 1);
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
					cam.transform.position = goPosition + newCamPosition; //TO-DO: Get rid of this little magic.
					cam.transform.LookAt(goPosition);
					camPosition = cam.transform.position;

					var hits : RaycastHit[];
					Debug.DrawRay(goPosition, (camPosition - goPosition), Color.green, 100, true);
					hits = Physics.SphereCastAll(goPosition, 1.0f, (camPosition - goPosition));

					for(var j = 0; j < hits.Length; j++) { 
						var go : GameObject = hits[j].transform.gameObject;
						if(go != child) {
							go.renderer.enabled = false;
							SetRendererRGBA(go.renderer, 1, 1, 1, Mathf.Min(child.renderer.material.color.a, 0.1));
							go.collider.enabled = false; // For the double-click feature.
						}
					}
					focusStatus = FocusStatus.Default;
				}
			}
		}
		FocusOnObject(child, gameObject);
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
				FocusOnObject(this.ifcObjectContainer, GetGameObjectById(this.ifcObjectContainer, id));
			}
			break;
	}

	if(type){
		Application.ExternalCall("UnityFacade_HandleMessage", type, params);
	}
}