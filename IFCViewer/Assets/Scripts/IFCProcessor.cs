using UnityEngine;

class IFCProcessor
{
	private Shader defaultShader = null;

	public void Process(GameObject gameObject)
	{
		this.defaultShader = Shader.Find("Transparent/Diffuse");
		ProcessTree(gameObject);
	}

	private void ProcessTree(GameObject tree)
	{
		for(int i = 0; i < tree.transform.childCount; i++)
		{
			GameObject child  = tree.transform.GetChild(i).gameObject;
			if(child.renderer)
			{
				foreach(Material material in child.renderer.materials)
					material.shader = this.defaultShader; // Change shader (for transparency)
 				child.AddComponent<MeshCollider>(); // Add default MeshCollider (for rays)
			}
			ProcessTree(child); // Process childs first because some components use their child's information to generate their own
			IFCComponent ifc = child.AddComponent<IFCComponent>(); // Add default IFCComponent
			ifc.Generate();
		}
	}
}