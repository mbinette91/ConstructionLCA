//Script from: http://answers.unity3d.com/questions/548794/how-to-move-a-camera-only-using-the-arrow-keys.html
using UnityEngine;
using System.Collections;

public class KeysMovement : MonoBehaviour {
	public int speed = 1;

	void Start () {
	
	}
	
	void Update()
	{
		if(Input.GetKey(KeyCode.RightArrow))
		{
			transform.Translate(new Vector3(speed * Time.deltaTime,0,0));
		}
		if(Input.GetKey(KeyCode.LeftArrow))
		{
			transform.Translate(new Vector3(-speed * Time.deltaTime,0,0));
		}
		if(Input.GetKey(KeyCode.DownArrow))
		{
			transform.Translate(new Vector3(0,-speed * Time.deltaTime,0));
		}
		if(Input.GetKey(KeyCode.UpArrow))
		{
			transform.Translate(new Vector3(0,speed * Time.deltaTime,0));
		}
	}
}
