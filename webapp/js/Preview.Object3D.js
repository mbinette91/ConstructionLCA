function Object3D() {
    this.object = null;
    this.tm = null;
    this.name = "";
    this.material = null;
    this.state = 3;
    this.ref = 0;
}
Object3D.prototype.addRef = function() {
    this.ref++;
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
Object3D.prototype.traverse = function(ptm, proc, param, astate) {
    astate |= (this.state & 4);
    if (this.state & 0xff00) {
        astate &= ~0xff00;
        astate |= this.state & 0xff00;
    }
    var v = 3; {
        v = this.state & 3;
        if (!v) return;
    }
    var newtm;
    if (this.tm) {
        if (ptm) {
            newtm = mat4.create();
            mat4.m(this.tm, ptm, newtm);
        } else newtm = this.tm;
    } else newtm = ptm;
    if (v & 1) {
        if (!proc(this, newtm, param, astate)) return;
    }
    if (v & 2) {
        var child = this.firstChild;
        while (child) {
            child.traverse(newtm, proc, param, astate);
            child = child.next;
        }
    }
};
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

function nodeRender(node, tm, scene, state) {
    var o = node.object;
    if (o) {
        if (state & 4 && scene.cfgSelZOffset) state |= 0x20000;
        if (o.boxMin) scene.toRenderQueue(tm, node, state);
    }
    return true;
}

Object3D.prototype.getWTM = function() {
    var tm = null;
    var n = this;
    while (n) {
        if (n.tm) {
            if (tm) {
                mat4.m(tm, n.tm);
            } else tm = mat4.create(n.tm);
        }
        n = n.parent;
    }
    return tm;
};