function Object3D() {
    this.object = null;
    this.tm = null;
    this.name = "";
    this.material = null;
    this.state = 3;
    this.ref = 0;
}
Object3D.prototype.release = function() {
    this.ref--;
    if (this.ref < 1) this.clear();
}
Object3D.prototype.newNode = function() {
    return this.insert(new Object3D());
}
Object3D.prototype.insert = function(n) {
    n.ref++;
    if (this.lastChild) this.lastChild.next = n;
    else
        this.firstChild = n;
    this.lastChild = n;
    n.parent = this;
    return n;
}
Object3D.prototype.clear = function() {
    while (this.firstChild) this.remove(this.firstChild);
    this.setObject(null);
}
Object3D.prototype.remove = function(n) {
    if (n.parent != this) return false;
    var _n = null;
    if (this.firstChild == n) {
        this.firstChild = n.next;
    } else {
        _n = this.firstChild;
        while (_n) {
            if (_n.next == n) {
                _n.next = n.next;
                break;
            }
            _n = _n.next;
        }
    }
    if (this.lastChild == n) this.lastChild = _n;
    n.parent = null;
    n.next = null;
    n.release();
    return true;
}
Object3D.prototype.setState = function(s, mask) {
    var _state = this.state & (~mask) | mask & s;
    if (_state != this.state) {
        this.state = _state;
        return true;
    }
    return false;
}

Object3D.prototype.setObject = function(obj) {
    if (this.object != obj) {
        if (this.object) this.object.release();
        this.object = obj;
        if(obj) {
            this.object.bump = (this.material && this.material.bump && this.object);
            obj.ref++;
        }
    }
}
Object3D.prototype.setMaterial = function(scene, material) {
    this.material = material;
    if(this.object)
        this.object.bump = (material && material.bump);
    scene.invalidate();
}
Object3D.prototype.load = function(data, scene) {
    var i;
    if (data.guid !== undefined) { // Leaf
        scene.objects3d[data.guid] = this;
        this.setMaterial(scene, scene.materials.search('default'));
    }
    else // Not leaf
        for (i = 0; i < data.length; i++) {
            var node = this.newNode();
            node.load(data[i], scene);
        }
};

Object3D.prototype.render = function(tm, scene, state) {
    var o = this.object;
    if (o) {
        if (o.boxMin) scene.toRenderQueue(tm, this, this.state);
    }
    return true;
}