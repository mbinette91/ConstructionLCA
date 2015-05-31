using UnityEngine;
using System.Collections;

public class TestIFCProcessorBehaviour : MonoBehaviour {
	void Start () {
		IFCProcessor processor = new IFCProcessor();
		processor.Process(this.gameObject);
	}
}
