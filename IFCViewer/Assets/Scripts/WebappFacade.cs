using UnityEngine;
using System.Collections;

public class WebappFacade : MonoBehaviour
{
	GameObject ifcObjectContainer;
	private float lastClickTime = 0;
	private float catchTime = 0.25f;
	private Vector3 modelMiddlePoint = new Vector3(-3,6,-2);
	private float distanceCamFocus = 5;

	enum FocusStatus { Default, Custom, None };
	FocusStatus focusStatus;
	Vector3 _initialCameraPosition;
	Quaternion _initialCameraRotation;

	void Start () {
		Application.ExternalCall("UnityFacade_HandleMessage", "DoneLoading");
		this.ifcObjectContainer = GameObject.Find("IFCObjectContainer");
		ResetObjectStyle(this.ifcObjectContainer);

		_initialCameraPosition = Camera.main.transform.position;
		_initialCameraRotation = Camera.main.transform.rotation;

		//Tests:
		//this.SetTreeVisibility(this.ifcObjectContainer, "10100000000110000000000000000000000001101000000000000000");
		//this.FocusOnObject(this.ifcObjectContainer, GetGameObjectById(this.ifcObjectContainer, 19));
	}

	void Update () {
		if(Input.GetButtonDown("Fire1")){
			if(Time.time - lastClickTime < catchTime){
				Ray ray  = Camera.main.ScreenPointToRay(Input.mousePosition);
				//Debug.DrawRay(ray.origin, 10*ray.direction, Color.red, 100, true);
				RaycastHit hit;
				if (Physics.Raycast(ray, out hit)) {
					ResetObjectStyle(this.ifcObjectContainer);
					this.FocusOnObject(this.ifcObjectContainer, hit.transform.gameObject);
				}
				else
					this.ResetFocus();
			}
			lastClickTime = Time.time;
		}
	}

	ArrayList GetTree(GameObject tree) {
		// Structure: Node: [nodeName, [childNode, ...]], params: [Node, ...]
		var components = new ArrayList();
		for(var i = 0; i < tree.transform.childCount; i++) {
			var node = new ArrayList();
			GameObject child = tree.transform.GetChild(i).gameObject;
			node.Add(child.name);
			node.Add(GetTree(child));
			components.Add(node);
		}
		return components;
	}

	void ResetFocus() {
		ResetObjectStyle(this.ifcObjectContainer);
		Camera.main.transform.position = _initialCameraPosition;
		Camera.main.transform.rotation = _initialCameraRotation;
	}

	void ResetObjectStyle(GameObject tree) {
		for(var i = 0; i < tree.transform.childCount; i++) {
			GameObject child = tree.transform.GetChild(i).gameObject;
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

	void SetRendererRGBA(Renderer renderer, float r, float g, float b, float a){
		for(var j = 0; j < renderer.materials.Length; j++) {
			Material material = renderer.materials[j];
			material.color = new Color(r, g, b, a);
		}
	}

	GameObject GetGameObjectById(GameObject tree, int id) {
		for(var i = 0; i < tree.transform.childCount; i++) {
			GameObject child = tree.transform.GetChild(i).gameObject;
			if(id == 0) {
				return child;
			}

			id--;
			GameObject go = GetGameObjectById(child, id);
			if(go)
				return go;
		}

		return null; // Not found!
	}

	void FocusOnObject(GameObject tree, GameObject gameObject) {
		for(var i = 0; i < tree.transform.childCount; i++) {
			GameObject child = tree.transform.GetChild(i).gameObject;
			if(child.renderer){
				if(child.transform.childCount == 0) {
					if(child != gameObject){
						SetRendererRGBA(child.renderer, 1, 1, 1, Mathf.Min(child.renderer.material.color.a, 0.9f));
					}
					else {
						SetRendererRGBA(child.renderer, 0.5f, 1, 1, 1);
						Camera cam = Camera.main;
						Vector3 camPosition = modelMiddlePoint; //Start from the middle
						Vector3 goPosition = child.transform.position;
						IFCComponent ifcComp = child.GetComponent<IFCComponent>();
						goPosition = ifcComp.centroid;
						var newCamPosition = (camPosition - goPosition).normalized * this.distanceCamFocus;
						cam.transform.position = goPosition + newCamPosition; //TO-DO: Get rid of this little magic.
						cam.transform.LookAt(goPosition);
						camPosition = cam.transform.position;

						RaycastHit[] hits;
						Debug.DrawRay(goPosition, (camPosition - goPosition), Color.green, 100, true);
						hits = Physics.SphereCastAll(goPosition, 1.0f, (camPosition - goPosition));

						for(var j = 0; j < hits.Length; j++) { 
							GameObject go = hits[j].transform.gameObject;
							if(go != child) {
								go.renderer.enabled = false;
								SetRendererRGBA(go.renderer, 1, 1, 1, Mathf.Min(child.renderer.material.color.a, 0.1f));
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

	string SetTreeVisibility(GameObject tree, string bits) {
		// Returns new bits
		// Only leaves' visibility are set. Parents must be left alone, else all children will be affected.
		for(var i = 0; i < tree.transform.childCount; i++) {
			GameObject child = tree.transform.GetChild(i).gameObject;
			var status = bits[0] == '1';
			if(child.transform.childCount == 0)
				child.renderer.enabled = status;
			bits = SetTreeVisibility(child, bits.Substring(1));
		}
		return bits;
	}

	void HandleMessage(string message) {
		string type = null;
		var args = new ArrayList();
		var messageParts = message.Split('-');
		var messageType = messageParts[0];
		switch(messageType){
			case "GetTree":
				type = "SetTree";
				args = GetTree(this.ifcObjectContainer);
				break;
			case "SetTreeVisibility":
				if(messageParts.Length > 1){
					SetTreeVisibility(this.ifcObjectContainer, messageParts[1]);
				}
				break;
			case "FocusOnObject":
				if(messageParts.Length > 1){
					var id = int.Parse(messageParts[1]);
					ResetObjectStyle(this.ifcObjectContainer);
					FocusOnObject(this.ifcObjectContainer, GetGameObjectById(this.ifcObjectContainer, id));
				}
				break;
		}

		if(type != null){
			Application.ExternalCall("UnityFacade_HandleMessage", type, args);
		}
	}
}