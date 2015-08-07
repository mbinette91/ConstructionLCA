/*
* Author: Mathieu Binette
* Features:
*   - Represents an IFC element. 
*   - Is only sent to the rendering queue if it's inside the rendering area.
*/

function Object3D(guid) {
    this.guid = guid;

    this.mesh = null;
    this.name = "";
    this.material = null;
    this.state = 3;
};

Object3D.prototype.release = function() {
    this.setMesh(null);
};

Object3D.prototype.setState = function(s, mask) {
    var _state = this.state & (~mask) | mask & s;
    if (_state != this.state) {
        this.state = _state;
        return true;
    }
    return false;
};

Object3D.prototype.setMesh = function(mesh) {
    if (this.mesh != mesh) {
        if (this.mesh) 
            this.mesh.release();
        this.mesh = mesh;
        if(mesh) {
            this.mesh.bump = (this.material && this.material.bump && this.mesh);
            mesh.ref++;
        }
    }
};

Object3D.prototype.setMaterial = function(scene, material) {
    this.material = material;
    if(this.mesh)
        this.mesh.bump = (material && material.bump);
    scene.invalidate();
}

Object3D.prototype.render = function(tm, scene, state) {
    var mesh = this.mesh;
    if (mesh) {
        if (mesh.boxMin) scene.toRenderQueue(tm, this, this.state);
    }
    return true;
};