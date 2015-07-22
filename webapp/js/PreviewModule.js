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
    this.canvas = canvas;
    this.mvMatrix = mat4.create();
    this.viewFrom = [0, 0, 6];
    this.viewTo = [0, 0, 0];
    this.viewUp = [0, 1, 0];
    this.bkColor = 0xcccccc;
    this._drawScene_Timeout = false;

    this.input = new PreviewModule.InputHandler(this);
}

PreviewModule.prototype.initialize = function(file, path) {
    this.initHardware();
    if (this.gl) {
        this.loadSpace(file, path);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.input.initialize();
        this.invalidate();
    }
}

PreviewModule.prototype.setSize = function(width, height) {
    $(this.canvas).attr("width", width);
    $(this.canvas).attr("height", height);
    this.initHardware();
    this.invalidate();
};

PreviewModule.prototype.setNodeInformation = function(data) {
    var space = this.scene;
    for(var i in data) {
        var obj = space.objects3d[data[i].guid];
        if(obj){
            obj.data = data[i];
            obj.setMaterial(space, space.materials.search(data[i]));
        }
    }
}

PreviewModule.prototype.initHardware = function() {
    var n = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < n.length; i++) {
        try {
            this.gl = this.canvas.getContext(n[i], {
                alpha: false
            });
        } catch (e) {}
        if (this.gl) {
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
            break;
        }
    }
    if (!this.gl) {
        alert("Could not initialise WebGL");
    }
    return this.gl != null;
}
PreviewModule.prototype.getView = function(i) {
    if (i) i.update(this);
    else i = new viewInfo(this);
    return i;
}
PreviewModule.prototype.setViewImp = function(v) {
    vec3.cpy(this.viewFrom, v.from || v.org);
    vec3.cpy(this.viewTo, v.to || v.target);
    vec3.cpy(this.viewUp, v.up);
    var _dir = [],
        _up = [];
    vec3.subtractN(this.viewTo, this.viewFrom, _dir);
    vec3.subtractN(this.viewUp, this.viewFrom, _up);
    var _dot = vec3.dot(_dir, _up);
    if (Math.abs(_dot) > 1e-5) {
        var a2 = [],
            a1 = [];
        vec3.cross_normalize(_dir, _up, a2);
        vec3.cross_normalize(_dir, a2, a1);
        _dot = vec3.dot(_up, a1);
        if (_dot < 0) vec3.scale(a1, -1);
        vec3.add(this.viewFrom, a1, this.viewUp);
    }
}
PreviewModule.prototype.setDefView = function() {
    this.setViewImp(this.scene.view);
    this.invalidate(IV.INV_VERSION);
}
PreviewModule.prototype.loadSpace = function(file, path) {
    this.scene = new Scene(this, this.gl, path);
    var r = new XMLHttpRequest();
    r.open("GET", path + file);
    r.ivspace = this.scene;
    r.ivwnd = this;
    var that = this;
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            this.ivspace.load(JSON.parse(this.responseText));
            this.ivwnd.setDefView();
        }
    }
    r.send();
}
PreviewModule.prototype.getDoubleSided = function() {
    return this.scene.cfgDbl;
}
PreviewModule.prototype.setDoubleSided = function(b) {
    if (this.scene.cfgDbl != b) {
        var s = this.scene;
        s.cfgDbl = b;
        s.invalidate(IV.INV_MTLS);
    }
}
PreviewModule.prototype.getTextures = function() {
    return this.scene.cfgTextures;
}
PreviewModule.prototype.setTextures = function(b) {
    if (this.scene.cfgTextures != b) {
        this.scene.cfgTextures = b;
        this.invalidate();
    }
}
PreviewModule.prototype.setLights = function(l) {
    this.scene.lights = l;
    this.invalidate(IV.INV_MTLS);
}

PreviewModule.prototype.updateMVTM = function() {
    mat4.lookAt(this.viewFrom, this.viewTo, this.getUpVector(), this.mvMatrix);
}
PreviewModule.prototype.drawScene = function() {
    var gl = this.gl;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    var bk = this.bkColor;
    var r = ((bk >> 16) & 0xff) / 255.0;
    var g = ((bk >> 8) & 0xff) / 255.0;
    var b = (bk & 0xff) / 255.0;
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.updateMVTM();
    this.scene.render(this.mvMatrix);
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
node3d.prototype.setMaterial = function(space, material) {
    this.material = material;
    if(this.object)
        this.object.bump = (material && material.bump);
    space.invalidate();
}
node3d.prototype.load = function(d, space) {
    var i, j;
    if (d.guid !== undefined) {
        space.objects3d[d.guid] = this;
    }
    if (d.name !== undefined) this.name = d.name;
    if (d.meta !== undefined) this.meta = d.meta;
    if (d.camera !== undefined) this.camera = d.camera;

    this.setMaterial(space, space.materials.search('default'));

    if (d.s != undefined) this.state = d.s;
    if (d.t != undefined) this.type = d.t;
    if (d.tm) {
        this.tm = mat4.create();
        mat4.identity(this.tm);
        var index = 0;
        for (i = 0; i < 4; i++) {
            for (j = 0; j < 3; j++) {
                this.tm[i * 4 + j] = d.tm[index];
                index++;
            }
        }
    }
    if (d.i) {
        var n = d.i;
        for (i = 0; i < n.length; i++) {
            var node = this.newNode();
            node.load(n[i], space);
        }
    }
};

function nodeRender(node, tm, space, state) {
    var o = node.object;
    if (o) {
        if (state & 4 && space.cfgSelZOffset) state |= 0x20000;
        if (o.boxMin) space.toRenderQueue(tm, node, state);
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

function viewInfo(v) {
    this.from = [];
    this.to = [];
    this.up = [];
    this.update(v);
}
viewInfo.prototype.update = function(from, to, up) {
    if (from) {
        if (to) {
            vec3.cpy(this.from, from);
            vec3.cpy(this.to, to);
            vec3.cpy(this.up, up);
        } else {
            var v = from;
            vec3.cpy(this.from, v.viewFrom || v.from);
            vec3.cpy(this.to, v.viewTo || v.to);
            vec3.cpy(this.up, v.viewUp || v.up);
        }
    }
}
viewInfo.prototype.getUpVector = function(v) {
    return vec3.subtract(this.up, this.from, v || []);
}
viewInfo.prototype.getViewVector = function(v) {
    return vec3.subtract(this.to, this.from, v || []);
}
viewInfo.prototype.getViewVectorN = function(v) {
    return vec3.subtractN(this.to, this.from, v || []);
}
viewInfo.prototype.compare = function(v) {
    return (vec3.compare(this.from, v.from, 1e-6) && vec3.compare(this.to, v.to, 1e-6) && vec3.compare(this.up, v.up, 1e-6));
}
