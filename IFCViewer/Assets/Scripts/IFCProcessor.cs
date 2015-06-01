using UnityEngine;

class IFCProcessor
{
	private GameObject root = null;
	private Shader defaultShader = null;

	public void Process(GameObject root)
	{
		this.root = root;
		this.defaultShader = Shader.Find("Transparent/Diffuse");
		Reorganize(root);
		ProcessTree(root);
	}

	private GameObject Reorganize_CurrentCateg = null;
	private void Reorganize(GameObject tree)
	{
		if(tree != root) // Don't reorganize the root node!
		{
			string[] parts = tree.name.Split('_');
			parts[0] = parts[0].Replace("Ifc", ""); // Get rid of IFC prefix (if any)
			if(parts.Length > 1)
			{
				if(Reorganize_CurrentCateg == null || Reorganize_CurrentCateg.name != parts[0])
				{
					Reorganize_CurrentCateg = new GameObject();
					Reorganize_CurrentCateg.name = parts[0]; 
					Reorganize_CurrentCateg.transform.parent = tree.transform.parent;
				}
				tree.name = parts[1];
				tree.transform.parent = Reorganize_CurrentCateg.transform;
			}
			else
			{
				Reorganize_CurrentCateg = null;
				tree.name = parts[0];
				tree.transform.parent = tree.transform.parent; // Append it to the end of the tree (keep the original order)
			}
		}

		int initialChildrenCount = tree.transform.childCount; // It'll change while we're reorganizing!
		for(int i = 0; i < initialChildrenCount; i++)
		{
			// Always take index 0 since we're moving them to the end of the tree.
			Reorganize(tree.transform.GetChild(0).gameObject); 
		}
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
		}
		IFCComponent ifc = tree.AddComponent<IFCComponent>(); // Add default IFCComponent
		ifc.Generate();
	}
}