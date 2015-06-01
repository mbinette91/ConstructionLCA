using UnityEngine;
using System.Collections;

public class TestIFCProcessorBehaviour : MonoBehaviour {
	void Awake () { // Called before any Start()
		IFCProcessor processor = new IFCProcessor();
		processor.Process(this.gameObject);
	}
}
