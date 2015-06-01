using UnityEngine;
using System.Collections;

public static class IFCGameObjectExtension
{
	public static IFCComponent ifc(this GameObject go)
	{
		return go.GetComponent<IFCComponent>();
	}
}

public class IFCComponent : MonoBehaviour
{
	// We can store information here in the post processing of the IFC Model.
	// -> Some components might use their child's information to generate their own.
	public static int ID_AUTOINCREMENT = 1;
	public string id;
	public Vector3 verticesMin = Vector3.zero;
	public Vector3 verticesMax = Vector3.zero;

	public Vector3 centroid{
		get {
			return (verticesMax + verticesMin) / 2;
		}
	}
	public Vector3 size {
		get {
			return verticesMax - verticesMin;
		}
	}
	public Vector3 facing {
		get {
			Vector3 a = new Vector3(size.x, 0, 0);
			Vector3 b = new Vector3(0, size.y, 0);
			Vector3 c = new Vector3(0, 0, size.z);
			Vector3 side1 = a - b;
			Vector3 side2 = a - c;
			return Vector3.Cross(side1, side2).normalized;
		}
	}

	public void Generate()
	{
		id = "ID_" + ID_AUTOINCREMENT;
		ID_AUTOINCREMENT++;
		GenerateGeometry();
	}

	private void GenerateGeometry()
	{
		verticesMin = new Vector3(float.MaxValue, float.MaxValue, float.MaxValue);
		verticesMax = new Vector3(float.MinValue, float.MinValue, float.MinValue);

		MeshFilter meshFilter = this.gameObject.GetComponent<MeshFilter>();
		if(meshFilter != null)
		{
			foreach(Vector3 vertex in meshFilter.mesh.vertices)
			{
				verticesMin = Vector3.Min(verticesMin, vertex);
				verticesMax = Vector3.Max(verticesMax, vertex);
			}
		}

		// Also consider the GameObject's children
		IFCComponent[] ifcComponents = this.gameObject.GetComponentsInChildren<IFCComponent>();
		foreach(IFCComponent ifcComponent in ifcComponents)
		{
			verticesMin = Vector3.Min(verticesMin, ifcComponent.verticesMin);
			verticesMax = Vector3.Max(verticesMax, ifcComponent.verticesMax);
		}
	}
}
