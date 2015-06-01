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
		for(var i = 0; i < tree.transform.childCount; i++) {
			GameObject child = tree.transform.GetChild(i).gameObject;
			if(child.collider){
				child.collider.enabled = true;
			}
			if(child.renderer){
				child.renderer.enabled = true;
				SetColor(child.renderer, color);
				SetShader(child.renderer, this.defaultShader);
			}
			ResetTree(child, color);
		}
	}

	public void SetColor(Renderer renderer, Color color)
	{
		for(var j = 0; j < renderer.materials.Length; j++) {
			Material material = renderer.materials[j];
			material.color = color;
		}
	}

	private void SetShader(Renderer renderer, Shader shader)
	{
		for(var j = 0; j < renderer.materials.Length; j++) {
			renderer.materials[j].shader = shader;
		}
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
				SetShader(gameObject.renderer, defaultShader);
				SetColor(gameObject.renderer, focusColor);
				break;
			case CameraFocus.ComponentStatus.InFront:
				gameObject.renderer.enabled = false;
				break;
			case CameraFocus.ComponentStatus.Behind:
				SetShader(gameObject.renderer, behindShader);
				break;

		}
	}
}