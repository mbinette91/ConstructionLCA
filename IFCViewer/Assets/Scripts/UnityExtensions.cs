using UnityEngine;
using System.Collections;

public static class UnityExtensions
{
	public delegate void ApplyFunction(GameObject go);
	public static void ApplyRecursively(this GameObject tree, ApplyFunction function)
	{
		function(tree);
		for(var i = 0; i < tree.transform.childCount; i++) 
		{
			tree.transform.GetChild(i).gameObject.ApplyRecursively(function);
		}
	}

	public delegate void ApplyToMaterialsFunction(Material material);
	public static void ApplyToMaterialsRecursively(this GameObject tree, ApplyToMaterialsFunction function)
	{
		tree.ApplyRecursively( delegate(GameObject go) {
			if(go.renderer != null)
			{
				for(var j = 0; j < go.renderer.materials.Length; j++)
				{
					function(go.renderer.materials[j]);
				}
			}
		});
	}
}