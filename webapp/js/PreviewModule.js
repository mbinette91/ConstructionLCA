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
    this.mouseCaptured = false;
    this.mouseCancelPopup = false;
    this.mouseMoved = false;
    this.viewFrom = [0, 0, 6];
    this.viewTo = [0, 0, 0];
    this.viewUp = [0, 1, 0];
    this.fov = 90;
    this.LX = 0;
    this.LY = 0;
    this.lastTouchDistance = -1;
    this.orbitMode = 1;
    this.cameraMode = 0;
    this.bkColor = 0xcccccc;
    this.vpVersion = 0;
    this.timer = false;
}

PreviewModule.prototype.initialize = function(file, path) {
    this.initHardware();
    if (this.gl) {
        if (file) this.loadSpace(file, path);
        else this.space = null;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.initHandlers();
        this.initEvents();
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
    var space = this.space;
    for(var i in data) {
        var obj = space.objects3d[data[i].guid];
        if(obj){
            obj.data = data[i];
            obj.setMaterial(space, space.materials.search(data[i]));
        }
    }
}

space3d.prototype.onDataLoaded = function() {
    this.materials.initialize();
}

function space3d(view, gl) {
    this.cfgTextures = true;
    this.gl = gl;
    this.window = view;
    this.root = null;
    this.view = null;
    this.projectionTM = mat4.create();
    this.modelviewTM = mat4.create();
    this.cfgDbl = true;
    this.cfgSelZOffset = false;
    this.textures = [];
    this.lights = 0;
    this.activeShader = null;
    this.pre = [];
    this.post = [];
    this.clrSelection = [1, 0, 0];
    this.rmode = 0;
    this.objects3d = {};
    this.meshSheets = new MeshSheets();
    this.materials = IFCMaterials.get(this);
    this.selectedObjects = [];
    this.rmodes = [{
        "f": true,
        "n": true,
        "e": false,
        "mtl": null
    }, {
        "f": false,
        "n": false,
        "e": true,
        "mtl": null
    }, ];
    if (gl) {
        this.e_ans = (gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));
        if (this.e_ans) this.e_ansMax = gl.getParameter(this.e_ans.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }
}

function CreateRequest(f, p) {
    if (f == undefined) return null;
    var r = new XMLHttpRequest();
    path = f;
    if (p) 
        path = p + f;
    r._requestUrl = path;
    r.open("GET", path);
    return r;
}
space3d.prototype.getWindow = function() {
    return this.window;
}
space3d.prototype.onMeshLoaded = function(m) {
    this.invalidate();
};
space3d.prototype.updateShadeArgs = function(a) {
    var gl = this.gl,
        i;
    var p = this.activeShader;
    var ca = (p) ? p.attrs.length : 0,
        na = a ? a.attrs.length : 0;
    if (na > ca) {
        console.log("AAAdd"+na+" "+ca)
        for (i = ca; i < na; i++) gl.enableVertexAttribArray(i);
    } else if (na < ca) {
        console.log("AAAdcccc"+na+" "+ca)
        for (i = na; i < ca; i++) gl.disableVertexAttribArray(i);
    }
}
space3d.prototype.setActiveShader = function(m, s, tm, flags) {
    if (s != this.activeShader) this.updateShadeArgs(s);
    if (s) s.activate(this, m, tm, flags, s == this.activeShader);
    else this.gl.useProgram(null);
    this.activeShader = s;
}
space3d.prototype.setActiveMaterialAndGetShader = function(mat, tm, flags) {
    var shader = mat.shader;
    this.setActiveShader(mat, shader, tm, flags);
    return shader;
}

space3d.prototype.invalidate = function(flags) {
    this.window.invalidate(flags);
}

function isPOW2(v) {
    return (v & (v - 1)) == 0;
}

space3d.prototype.getTexture = function(str, type) {
    var t;
    for (var i = 0; i < this.textures.length; i++) {
        var t = this.textures[i];
        if ((t.ivfile == str) && (t.ivtype == type)) {
            t.ivrefcount++;
            return t;
        }
    }
    var gl = this.gl;
    t = this.gl.createTexture();
    t.ivspace = this;
    t.ivready = false;
    t.ivfile = str;
    t.ivtype = type;
    t.ivrefcount = 1;
    this.textures.push(t);
    return t;
};

space3d.prototype.load = function(data) {
    if (data) {
        if (data.space) {
            var s = data.space,
                m = s.meshes,
                i, j;

            if (m)
                for (i = 0; i < m.length; i++) {
                    meshSheet = this.meshSheets.add(m[i]);
                }
            if (s.root) {
                if (!this.root) this.root = new node3d();
                this.root.load(s.root, this);
            }
            if (s.view) this.view = s.view;
            if (s.lights) {
                this.lights = s.lights;
                for (i = 0; i < this.lights.length; i++) {
                    var l = this.lights[i];
                    if (l.dir) vec3.normalize(l.dir);
                }
            }
            if (s.views) this.views = s.views;

            this.onDataLoaded();
        }
    }
};
space3d.prototype.renderQueue = function(items) {
    var c = items.length;
    var a;
    var gl = this.gl;
    for (var i = 0; i < c; i++) {
        var b = items[i];
        var d = this.cfgDbl || ((b.state & 32) != 0);
        if (d != a) {
            if (d) gl.disable(gl.CULL_FACE);
            else gl.enable(gl.CULL_FACE);
            a = d;
        }
        b.object.render(this, b);
    };
};
space3d.prototype.updatePrjTM = function(tm) {
    var w = this.window;
    var gl = this.gl;
    var v = [0, 0, 0];
    var bOk = false;
    var far = 0,
        near = 0,
        z;
    var tm = mat4.create();
    for (var iPass = 0; iPass < 2; iPass++) {
        var items = iPass ? this.post : this.pre;
        if (!items) continue;
        var c = items.length;
        for (var iO = 0; iO < c; iO++) {
            var d = items[iO];
            tm = mat4.m(d.tm, this.modelviewTM, tm);
            var _min = d.object.boxMin;
            var _max = d.object.boxMax;
            for (var i = 0; i < 8; i++) {
                v[0] = (i & 1) ? _max[0] : _min[0];
                v[1] = (i & 2) ? _max[1] : _min[1];
                v[2] = (i & 4) ? _max[2] : _min[2];
                mat4.mulPoint(tm, v);
                z = -v[2];
                if (bOk) {
                    if (z < near) near = z;
                    else if (z > far) far = z;
                } else {
                    far = near = z;
                    bOk = true
                };
            }
        }
    }
    if (bOk) {
        var d = far - near;
        d /= 100;
        far += d;
        near -= d;
        d = far / 1000;
        if (near < d) near = d;
    } else {
        near = 0.1;
        far = 100;
    }
    mat4.perspective(w.fov, gl.viewportWidth / gl.viewportHeight, near, far, this.projectionTM);
};
space3d.prototype.render = function(tm) {
    if (this.root) {
        if(!this.meshSheets.complete)
            this.meshSheets.loadAll(this);

        var gl = this.gl;
        gl.cullFace(gl.BACK);
        var tmw = mat4.create();
        mat4.identity(tmw);
        this.root.traverse(tmw, nodeRender, this, this.rmode << 8);
        mat4.copy(tm, this.modelviewTM);
        this.updatePrjTM(tm);
        this.renderQueue(this.pre);
        this.pre = [];
        if (this.post.length) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            this.renderQueue(this.post);
            gl.disable(gl.BLEND);
            this.post = [];
        }
        //this.setActiveShader(null, 0);
    }
};
space3d.prototype.toRenderQueue = function(atm, node, state) {
    var mtl = node.material;
    if(!mtl)
        return; // Don't render elements with no materials
    var rmode = this.rmodes[(state & 0xff00) >> 8];
    if (rmode.mtl) mtl = rmode.mtl;
    var item = {
        "tm": atm,
        "object": node.object,
        "mtl": mtl,
        "state": (state | (node.state & (16 | 32 | 0x30000)))
    };
    var l = (mtl.opacity != undefined) ? this.post : this.pre;
    l.push(item);
};

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

PreviewModule.prototype.getWindow = function() {
    return this;
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
PreviewModule.prototype.getView = function(i) {
    if (i) i.update(this);
    else i = new viewInfo(this);
    return i;
}
PreviewModule.prototype.setViewImp = function(v) {
    if (v.fov) this.fov = v.fov;
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
    this.setViewImp(this.space.view);
    this.invalidate(IV.INV_VERSION);
}
PreviewModule.prototype.loadSpace = function(file, path) {
    this.space = new space3d(this, this.gl);
    if (path != undefined) this.space.path = path;
    var r = CreateRequest(file, path);
    r.ivspace = this.space;
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
    return this.space.cfgDbl;
}
PreviewModule.prototype.setDoubleSided = function(b) {
    if (this.space.cfgDbl != b) {
        var s = this.space;
        s.cfgDbl = b;
        s.invalidate(IV.INV_MTLS);
    }
}
PreviewModule.prototype.getTextures = function() {
    return this.space.cfgTextures;
}
PreviewModule.prototype.setTextures = function(b) {
    if (this.space.cfgTextures != b) {
        this.space.cfgTextures = b;
        this.invalidate();
    }
}
PreviewModule.prototype.setLights = function(l) {
    this.space.lights = l;
    this.invalidate(IV.INV_MTLS);
}

PreviewModule.prototype.getUpVector = function() {
    return vec3.sub_r(this.viewUp, this.viewFrom);
}
PreviewModule.prototype.getRay = function(x, y, ray) {
    var gl = this.gl,
        w = gl.viewportWidth,
        h = gl.viewportHeight;
    gl.viewport(0, 0, w, h);
    var p1 = this.viewFrom,
        p2 = this.viewTo;
    var dir = vec3.sub_r(this.viewTo, this.viewFrom);
    var dirLen = vec3.length(dir);
    var up = this.getUpVector();
    var k = Math.tan(Math.PI * this.fov / 360);
    var h2 = h / 2,
        w2 = w / 2;
    var _k = (h2 - y) / h2;
    var _kx = (x - w2) / w2;
    vec3.normalize(up);
    x = vec3.cross_rn(dir, up);
    up = vec3.scale_r(up, k * dirLen * _k);
    x = vec3.scale_r(x, k * dirLen * _kx * w / h);
    var ray = [p1[0], p1[1], p1[2], p2[0] + up[0] + x[0], p2[1] + up[1] + x[1], p2[2] + up[2] + x[2]];
    return ray;
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
    this.space.render(this.mvMatrix);
    this.timer = false;
}
PreviewModule.prototype.invalidate = function(f) {
    if (f !== undefined) {
        if (f & IV.INV_VERSION) this.vpVersion++;
        if (f & IV.INV_MTLS && this.space.materials) {
            var _i = this.space.materials;
            for (var i = 0; i < _i.length; i++) _i[i].invalidate();
        }
    }
    if (this.timer) return;
    this.timer = true;
    setTimeout(this.drawScene.bind(this), 1);

    this.refreshSelectedObjectsInfo();
}
