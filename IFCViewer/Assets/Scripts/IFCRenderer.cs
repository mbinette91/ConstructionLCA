using UnityEngine;
using System.Collections;

public class IFCRenderer : MonoBehaviour
{
	Color focusColor = new Color(0.5f, 1, 1, 1);

	private Controller controller;
	private Shader defaultShader;
	private Shader behindShader; // Bug with some Transparent/Diffuse shaders behind focused object

	void Awake () 
	{
		controller = Controller.main;
		defaultShader = Shader.Find("Transparent/Diffuse");
		behindShader = Shader.Find("Diffuse");
	}

	void Start () 
	{
		
	}

	public void Reset() 
	{
		ResetTree(controller.ifcObjectContainer, new Color(1, 1, 1, 1)); // Default
	}

	private void ResetTree(GameObject tree, Color color) 
	{
		tree.ApplyRecursively( delegate(GameObject go) {
			if(go.collider){
				go.collider.enabled = true;
			}
			if(go.renderer){
				go.renderer.enabled = true;
			}
		});
		
		SetColor(tree, color);
		SetShader(tree, this.defaultShader);
	}

	public void SetColor(GameObject tree, Color color)
	{
		tree.ApplyToMaterialsRecursively( delegate(Material material) {
			material.color = color;
		});
	}

	private void SetShader(GameObject tree, Shader shader)
	{
		tree.ApplyToMaterialsRecursively( delegate(Material material) {
			material.shader = shader;
		});
	}

	public void PrepareFocus() 
	{
		ResetTree(controller.ifcObjectContainer, new Color(1, 1, 1, 0.9f)); // Default OnFocus color
	}

	public void SetComponentFocusStatus(GameObject gameObject, CameraFocus.ComponentStatus mode)
	{
		switch(mode)
		{
			case CameraFocus.ComponentStatus.Focused:
				SetShader(gameObject, defaultShader);
				SetColor(gameObject, focusColor);
				break;
			case CameraFocus.ComponentStatus.InFront:
				gameObject.renderer.enabled = false;
				break;
			case CameraFocus.ComponentStatus.Behind:
				SetShader(gameObject, behindShader);
				break;

		}
	}
}