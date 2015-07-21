function Scene(view, gl, path) {
	this.path = path;
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
        console.log("AAAdd"+na+" "+ca)
        for (i = ca; i < na; i++) gl.enableVertexAttribArray(i);
    } else if (na < ca) {
        console.log("AAAdcccc"+na+" "+ca)
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

Scene.prototype.invalidate = function(flags) {
    this.window.invalidate(flags);
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
Scene.prototype.renderQueue = function(items) {
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
Scene.prototype.updatePrjTM = function(tm) {
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
Scene.prototype.render = function(tm) {
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