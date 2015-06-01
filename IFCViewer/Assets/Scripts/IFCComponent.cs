using UnityEngine;
using System.Collections;

public class IFCComponent : MonoBehaviour
{
	// We can store information here in the post processing of the IFC Model.
	// -> Some components might use their child's information to generate their own.
	public string id;
	public Vector3 centroid = Vector3.zero;
	public Vector3 size = Vector3.zero;
	public Vector3 facing = Vector3.zero;

	public void Generate()
	{
		id = "default";
		GenerateGeometry();
	}

	private void GenerateGeometry()
	{
		Vector3 verticesSum = Vector3.zero;
		Vector3 verticesMin = new Vector3(float.MaxValue, float.MaxValue, float.MaxValue);
		Vector3 verticesMax = new Vector3(float.MinValue, float.MinValue, float.MinValue);

		MeshFilter meshFilter = this.gameObject.GetComponent<MeshFilter>();
		if(meshFilter != null)
		{
			foreach(Vector3 vertex in meshFilter.mesh.vertices)
			{
				verticesSum += vertex;
				verticesMin = Vector3.Min(verticesMin, vertex);
				verticesMax = Vector3.Max(verticesMax, vertex);
			}

			centroid = verticesSum / meshFilter.mesh.vertices.Length; //BAD CENTROID!!!
			centroid = (verticesMax + verticesMin) / 2;
			size = verticesMax - verticesMin;

			Vector3 a = new Vector3(size.x, 0, 0);
			Vector3 b = new Vector3(0, size.y, 0);
			Vector3 c = new Vector3(0, 0, size.z);
			Vector3 side1 = a - b;
			Vector3 side2 = a - c;
			facing = Vector3.Cross(side1, side2).normalized;
		}
	}
}
