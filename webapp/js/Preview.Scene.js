function Scene(preview, gl, path) {
    this.preview = preview;
    this.gl = gl;
	this.path = path;
    this.mvMatrix = mat4.create();

    this.cfgTextures = true;
    this.root = null;
    this.view = new Scene.View({"from" : [-2.39854, -2.18169, 1.21867], "up" : [-2, -2, 2], "to" : [0, 0, 0], "fov" : 52.2338});
    this.projectionTM = mat4.create();
    this.modelviewTM = mat4.create();
    this.cfgSelZOffset = false;
    this.textures = [];
    this.lights = [
        {"color":[0.5,0.5,0.5], "dir":[-0.7844649251679332,-0.5883479438760214,-0.19611598129200716], "type": 1},
        {"color":[0.8,0.8,0.9], "dir":[0.5907961528729553, 0.32493808408017716, -0.7384951910911942], "type": 1},
        {"color":[0.9,0.9,0.9], "dir":[0.009999365059592464, 0.004999687529793762, 0.9999375059587523], "type": 1},
        ];
    this.activeShader = null;
    this.pre = [];
    this.post = [];
    this.colorSelectedElement = [1, 0, 0];
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

Scene.View = function(data) {
    for(name in data)
        this[name] = data[name];
}
Scene.View.prototype.getUpVector = function(v) {
    return vec3.subtract(this.up, this.from, v || []);
}
Scene.View.prototype.getViewVector = function(v) {
    return vec3.subtract(this.to, this.from, v || []);
}
Scene.View.prototype.getViewVectorN = function(v) {
    return vec3.subtractN(this.to, this.from, v || []);
}
Scene.View.prototype.compare = function(v) {
    return (vec3.compare(this.from, v.from, 1e-6) && vec3.compare(this.to, v.to, 1e-6) && vec3.compare(this.up, v.up, 1e-6));
}

Scene.prototype.onDataLoaded = function() {
    this.materials.initialize();
}

Scene.prototype.onMeshLoaded = function(m) {
    this.invalidate();
};
Scene.prototype.updateShadeArgs = function(a) {
    var gl = this.gl,
        i;
    var p = this.activeShader;
    var ca = (p) ? p.attrs.length : 0,
        na = a ? a.attrs.length : 0;
    if (na > ca) {
        for (i = ca; i < na; i++) gl.enableVertexAttribArray(i);
    } else if (na < ca) {
        for (i = na; i < ca; i++) gl.disableVertexAttribArray(i);
    }
}
Scene.prototype.setActiveShader = function(m, s, tm, flags) {
    if (s != this.activeShader) this.updateShadeArgs(s);
    if (s) s.activate(this, m, tm, flags, s == this.activeShader);
    else this.gl.useProgram(null);
    this.activeShader = s;
}
Scene.prototype.setActiveMaterialAndGetShader = function(mat, tm, flags) {
    var shader = mat.shader;
    this.setActiveShader(mat, shader, tm, flags);
    return shader;
}

Scene.prototype.invalidate = function() {
    this.preview.invalidate();
}

Scene.prototype.getTexture = function(str, type) {
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

Scene.prototype.load = function(data) {
    if (data) {
        var o = data.objects,
            m = data.meshes,
            i;
        if (m) {
            for (i = 0; i < m.length; i++) {
                meshSheet = this.meshSheets.add(m[i]);
            }
        }
        if (o) {
            this.root = new Object3D();
            this.root.load(o, this);
        }

        this.onDataLoaded();
    }
};
Scene.prototype.renderQueue = function(items) {
    var c = items.length;
    var a;
    var gl = this.gl;
    for (var i = 0; i < c; i++) {
        var b = items[i];
        var d = false;
        b.object.render(this, b);
    };
};
Scene.prototype.updatePrjTM = function(tm) {
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
    mat4.perspective(this.view.fov, gl.viewportWidth / gl.viewportHeight, near, far, this.projectionTM);
};
Scene.prototype.updateMVTM = function() {
    return mat4.lookAt(this.view.from, this.view.to, this.view.getUpVector(), this.mvMatrix);
}
Scene.prototype.render = function() {
    var tm = this.updateMVTM();
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
Scene.prototype.toRenderQueue = function(atm, node, state) {
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