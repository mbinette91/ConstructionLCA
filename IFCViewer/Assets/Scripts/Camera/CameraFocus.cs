using UnityEngine;
using System.Collections;

public class CameraFocus : MonoBehaviour
{
	// Must be attached to a Camera!
	public enum ComponentStatus { Focused, InFront, Behind };
	public float DEBUG_durationRay = 10.0f;
	public float DEBUG_minLengthRay = 10.0f;

	private Controller controller;
	private float _initialDistance = 5;
	private float minDistanceCam = 1.5f; 
	private float lastClickTime = 0;
	private float catchTime = 0.25f;
	private Vector3 initialCameraPosition;
	private Quaternion initialCameraRotation;

	enum Status { Default, Custom, None };
	Status status;

	void Awake () 
	{
		controller = Controller.main;
	}
	
	void Start ()
	{
		initialCameraPosition = transform.position;
		initialCameraRotation = transform.rotation;
	}

	void Update ()
	{
		if(Input.GetButtonDown("Fire1"))
		{
			if(Time.time - lastClickTime < catchTime)
			{
				Ray ray  = camera.ScreenPointToRay(Input.mousePosition);
				// Debug.DrawRay(ray.origin, ray.direction * DEBUG_minLengthRay, Color.red, DEBUG_durationRay, true);
				RaycastHit hit;
				if (Physics.Raycast(ray, out hit))
				{
					controller.ifcRenderer.PrepareFocus();
					Focus(hit.transform.gameObject);
					IFCComponent ifc = hit.transform.gameObject.ifc();
					if(ifc)
						controller.SendMessageToWebapp("SetSelected", ifc.id);
				}
				else
				{
					controller.ifcRenderer.Reset();
					Reset();
					controller.SendMessageToWebapp("SetSelected", "");
				}
			}
			lastClickTime = Time.time;
		}
	}

	public void Reset()
	{
		controller.ifcRenderer.Reset();
		transform.position = initialCameraPosition;
		transform.rotation = initialCameraRotation;
	}

	public void Focus(GameObject gameObject)
	{
		IFCComponent ifcComp = gameObject.ifc();
		Vector3 goPosition = ifcComp.centroid;

		PlaceCamera(gameObject);

		Vector3 camPosition = transform.position;
		// Hits from Camera to object
		HandleRaycastHits(
			Physics.RaycastAll(goPosition, (camPosition - goPosition)), 
			delegate(GameObject go){ return go != gameObject; }, 
			delegate(GameObject go){ 
				controller.ifcRenderer.SetComponentFocusStatus(go, ComponentStatus.InFront);
				go.collider.enabled = false; // For the double-click feature.
			}
		);

		// Hits behind the object (bug with shaders)
		HandleRaycastHits(
			Physics.RaycastAll(goPosition, -(camPosition - goPosition)), 
			delegate(GameObject go){ return go != gameObject; }, 
			delegate(GameObject go){ 
				controller.ifcRenderer.SetComponentFocusStatus(go, ComponentStatus.Behind);
			}
		);

		// Set the FocusState for the main focused component
		controller.ifcRenderer.SetComponentFocusStatus(gameObject, ComponentStatus.Focused);

		status = Status.Default;
	}

	public delegate bool RaycastHitCondition(GameObject go);
	public delegate void RaycastHitHandler(GameObject go);
	private void HandleRaycastHits(RaycastHit[] hits, RaycastHitCondition condition, RaycastHitHandler function){
		for(var j = 0; j < hits.Length; j++)
		{ 
			GameObject go = hits[j].transform.gameObject;
			if(condition(go))
			{
				function(go);
			}
		}
	}

	private void PlaceCamera(GameObject gameObject)
	{
		IFCComponent ifcComp = gameObject.ifc();
		Vector3 goPosition = ifcComp.centroid;
		// Debug.DrawRay(goPosition, (ifcComp.facing) * DEBUG_minLengthRay, Color.red, DEBUG_durationRay, true);

		//First place the camera so it faces the object in the same direction as in it's final position
		transform.position = goPosition + ifcComp.facing * _initialDistance;
		transform.LookAt(goPosition);

		// Then determine the perfect distance the camera should be from the object
		//   Nothing perfect, just an acceptable heuristics for now.. 
		//   TO-DO: Fancy Mathematics.
		var projection = Vector3.Exclude(Camera.main.transform.forward, ifcComp.size);
		projection = Vector3.Exclude(ifcComp.facing, projection);
		var distanceCam = projection.magnitude;
		distanceCam = Mathf.Max(distanceCam, minDistanceCam);

		// Then readjust the camera's position once and for all
		transform.position = goPosition + ifcComp.facing * distanceCam;
		transform.LookAt(goPosition);
	}
}