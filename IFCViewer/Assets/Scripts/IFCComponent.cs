using UnityEngine;
using System.Collections;

// We can store information here in the post processing of the IFC Model.
// -> Some components might use their child's information to generate their own.
public class IFCComponent : MonoBehaviour {
	public string id;
	public Vector3 centroid;
	public Vector3 size;

	public void Generate(){
		id = "default";
		GenerateCentroid();
	}

	private void GenerateCentroid(){
		Vector3 verticesSum = Vector3.zero;

		MeshFilter meshFilter = this.gameObject.GetComponent<MeshFilter>();
		foreach(Vector3 vertex in meshFilter.mesh.vertices) {
			verticesSum += vertex;
		}

		centroid = verticesSum / meshFilter.mesh.vertices.Length;
	}
}
