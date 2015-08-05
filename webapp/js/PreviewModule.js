/*
* Reversed from http://www.finalmesh.com/webglmore.htm
*/

var IV = {
    INV_MTLS: 2,
    INV_VERSION: 4,
    R_SELECTION: 4,
    R_Z_NOWRITE: 16,
    R_Z_OFFSET: 0x30000,
};

function PreviewModule(canvas) {
    this.scene = null; // You must call PreviewModule::loadScene!
    this.canvas = canvas;
    this.bgColor = rgb(102, 102, 102);
    this.input = new PreviewModule.InputHandler(this);
    this._drawScene_Timeout = false;
}

PreviewModule.prototype.initialize = function(file, path) {
    if (this.initializeGL()) {
        this.loadScene(file, path);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.input.initialize();
        this.invalidate();
    }
    else
        console.log("PreviewModule.initialize: Could not initialize WebGL.");
}

PreviewModule.prototype.initializeGL = function() {
    var n = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < n.length; i++) {
        try {
            this.gl = this.canvas.getContext(n[i], { alpha: false });
            if (this.gl) {
                this.gl.viewportWidth = this.canvas.width;
                this.gl.viewportHeight = this.canvas.height;
                break;
            }
        } catch (e) { 
            continue; 
        }
    }
    return this.gl != null;
}

PreviewModule.prototype.loadScene = function(file, path) {
    var that = this;
    this.scene = new Scene(this, this.gl, path);
    var r = new XMLHttpRequest();
    r.open("GET", path + file);
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            that.scene.load(JSON.parse(this.responseText));
        }
    }
    r.send();
}

PreviewModule.prototype.setSize = function(width, height) {
    $(this.canvas).attr("width", width);
    $(this.canvas).attr("height", height);
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;
    this.invalidate();
};

PreviewModule.prototype.setNodeInformation = function(data) {
    var scene = this.scene;
    for(var i in data) {
        var obj = scene.objects3d[data[i].guid];
        if(obj){
            obj.data = data[i];
            var mat = scene.materials.search(data[i]);
            obj.setMaterial(scene, mat);
            if(mat.name == "invisible")
                scene.root.remove(obj);
        }
    }
}

PreviewModule.prototype.drawScene = function() {
    var gl = this.gl;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(this.bgColor[0], this.bgColor[1], this.bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.scene.render();
    this._drawScene_Timeout = null;
}

PreviewModule.prototype.invalidate = function(f) {
    if (f !== undefined) {
        if (f & IV.INV_MTLS && this.scene.materials) {
            var _i = this.scene.materials;
            for (var i = 0; i < _i.length; i++) _i[i].invalidate();
        }
    }
    if (this._drawScene_Timeout) return;
    this._drawScene_Timeout = setTimeout(this.drawScene.bind(this), 1);

    this.refreshSelectedObjectsInfo();
}

function node3d() {
    this.object = null;
    this.tm = null;
    this.name = "";
    this.material = null;
    this.state = 3;
    this.ref = 0;
}
node3d.prototype.addRef = function() {
    this.ref++;
}
node3d.prototype.release = function() {
    this.ref--;
    if (this.ref < 1) this.clear();
}
node3d.prototype.newNode = function() {
    return this.insert(new node3d());
}
node3d.prototype.insert = function(n) {
    n.ref++;
    if (this.lastChild) this.lastChild.next = n;
    else
        this.firstChild = n;
    this.lastChild = n;
    n.parent = this;
    return n;
}
node3d.prototype.clear = function() {
    while (this.firstChild) this.remove(this.firstChild);
    this.setObject(null);
}
node3d.prototype.remove = function(n) {
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
node3d.prototype.setState = function(s, mask) {
    var _state = this.state & (~mask) | mask & s;
    if (_state != this.state) {
        this.state = _state;
        return true;
    }
    return false;
}
node3d.prototype.traverse = function(ptm, proc, param, astate) {
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
node3d.prototype.setObject = function(obj) {
    if (this.object != obj) {
        if (this.object) this.object.release();
        this.object = obj;
        this.object.bump = (this.material && this.material.bump && this.object);
        if (obj) obj.ref++;
    }
}
node3d.prototype.setMaterial = function(scene, material) {
    this.material = material;
    if(this.object)
        this.object.bump = (material && material.bump);
    scene.invalidate();
}
node3d.prototype.load = function(data, scene) {
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

node3d.prototype.getWTM = function() {
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

function ivBufferF(gl, v, cmp) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    b.itemSize = cmp;
    b.numItems = v.length / cmp;
    return b;
};

function ivBufferI(gl, v) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, v, gl.STATIC_DRAW);
    b.itemSize = 1;
    b.numItems = v.length;
    return b;
}

function indexOf(a, b) {
    var c = a.length;
    for (var i = 0; i < c; i++) {
        if (a[i] == b) return i;
    }
    return -1;
}