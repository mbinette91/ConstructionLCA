/*
* Reversed from http://www.finalmesh.com/webglmore.htm
*
* Added:
*   - MeshSheet system (for cases in between the single-json-file and the one-json-file-per-product)
*   - Error handling for failed AJAX queries (e.g. too many queries)
*   - A maximum of simultaneous requests to prevent the errors from happening in the first place.
*/

var MAX_SIMULTANEOUS_AJAX_REQUESTS = 100;

var IV = {
    INV_MTLS: 2,
    INV_VERSION: 4,
    R_SELECTION: 4,
    R_Z_NOWRITE: 16,
    R_Z_OFFSET: 0x30000,
};

function MeshSheets() {
    this.sheets = {}
};
MeshSheets.prototype.add = function(sheet) {
    if(!sheet.length) sheet.length = 1; /*Default value for length*/
    sheet.request = null;
    sheet.objects = [];
    this.sheets[sheet.ref] = sheet;
    return sheet;
};
MeshSheets.prototype.get = function(sheet) {
    return this.sheets[sheet.ref];
};
MeshSheets.prototype.remove = function(sheet) {
    delete this.sheets[sheet.ref].objects;
    delete this.sheets[sheet.ref];
};

function space3d(view, gl) {
    this.cfgTextures = true;
    this.gl = gl;
    this.window = view;
    this.root = null;
    this.view = null;
    this.materials = [];
    this.projectionTM = mat4.create();
    this.modelviewTM = mat4.create();
    this.cfgDbl = true;
    this.cfgKeepMeshData = 3;
    this.cfgDefMtl = null;
    this.cfgSelZOffset = false;
    this.textures = [];
    this.lights = 0;
    this.activeShader = null;
    this.pre = [];
    this.post = [];
    this.clrSelection = [1, 0, 0];
    this.rmode = 0;
    this.meshSheetsInQueue = 0;
    this.meshSheets = new MeshSheets();
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
        for (i = ca; i < na; i++) gl.enableVertexAttribArray(i);
    } else if (na < ca) {
        for (i = na; i < ca; i++) gl.disableVertexAttribArray(i);
    }
    ca = p ? p.textures.length : 0;
    for (i = 0; i < ca; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        var txt = p.textures[i];
        var type = txt.txt.ivtype;
        gl.bindTexture(type === undefined ? gl.TEXTURE_2D : type, null);
    }
}
space3d.prototype.c1 = function(m, s, tm, flags) {
    if (s != this.activeShader) this.updateShadeArgs(s);
    if (s) s.activate(this, m, tm, flags, s == this.activeShader);
    else this.gl.useProgram(null);
    this.activeShader = s;
}
space3d.prototype.c2 = function(m, tm, flags) {
    var s = m ? m.getShader(flags) : 0;
    if (s && !s.bValid) {
        if (this.activeShader) this.c1(null, null);
        s.update(m);
    }
    this.c1(m, s, tm, flags);
    return s;
}

function bk3d(space, txt) {
    var gl = space.gl;
    this.uv = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
    this.uvBuffer = ivBufferF(gl, this.uv, 2);
    this.vBuffer = ivBufferF(gl, new Float32Array([-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, -1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0]), 3);
    var mtl = new material3d(space);
    var c = mtl.newChannel("emissive");
    mtl.newTexture(c, txt);
    c.wrapS = gl.CLAMP_TO_EDGE;
    c.wrapT = gl.CLAMP_TO_EDGE;
    this.mtl = mtl;
    this.texture = c.texture;
}
space3d.prototype.drawBk = function() {
    if (this.bk && this.bk.texture.ivready) {
        var gl = this.gl;
        if (gl.viewportHeight && gl.viewportWidth) {
            gl.clear(gl.DEPTH_BUFFER_BIT);
            var bk = this.bk;
            var s = this.c2(bk.mtl, null, 2);
            for (var i = 0; i < s.attrs.length; i++) {
                var v = s.attrs[i];
                var b = null;
                switch (v.id) {
                    case 4300:
                        b = bk.vBuffer;
                        gl.bindBuffer(gl.ARRAY_BUFFER, b);
                        break;
                    case 4302:
                        {
                            b = bk.uvBuffer;
                            gl.bindBuffer(gl.ARRAY_BUFFER, b);
                            var img = bk.texture.image;
                            var kx = gl.viewportWidth / img.naturalWidth,
                                ky = gl.viewportHeight / img.naturalHeight;
                            var x = 0,
                                y = 0;
                            if (kx > ky) y = (1.0 - ky / kx) / 2;
                            else
                            if (kx < ky) x = (1.0 - kx / ky) / 2;
                            var uv = bk.uv;
                            if (Math.abs(uv[0] - x) > 1e-5 || Math.abs(uv[1] - y) > 1e-5) {
                                uv[0] = x;
                                uv[1] = y;
                                uv[2] = 1.0 - x;
                                uv[3] = y;
                                uv[4] = x;
                                uv[5] = 1.0 - y;
                                uv[6] = x;
                                uv[7] = 1.0 - y;
                                uv[8] = 1.0 - x;
                                uv[9] = y;
                                uv[10] = 1.0 - x;
                                uv[11] = 1.0 - y;
                                gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
                            }
                        }
                        break;
                }
                if (b) gl.vertexAttribPointer(v.slot, b.itemSize, gl.FLOAT, false, 0, 0);
            }
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(false);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(true);
            return true;
        }
    }
    return false;
}
space3d.prototype.invalidate = function(flags) {
    this.window.invalidate(flags);
}

function isPOW2(v) {
    return (v & (v - 1)) == 0;
}

function handleLoadedTexture(texture) {
    if (texture.image.naturalWidth > 0 && texture.image.naturalHeight > 0) {
        var type = texture.ivtype;
        var gl = texture.ivspace.gl;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(type, texture);
        gl.texImage2D(type, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        var pot = isPOW2(texture.image.naturalWidth) && isPOW2(texture.image.naturalHeight);
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, pot ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR);
        if (pot) gl.generateMipmap(type);
        gl.bindTexture(type, null);
        texture.ivready = true;
        texture.ivpot = pot;
        texture.ivspace.invalidate();
    }
    delete texture.image.ivtexture;
    delete texture.ivspace;
}

function handleLoadedCubeTexture(image) {
    var texture = image.ivtexture;
    var gl = texture.ivspace.gl;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(image.ivface, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    texture.ivnumfaces++;
    if (texture.ivnumfaces == 6) {
        texture.ivready = true;
        texture.ivspace.invalidate();
        delete texture.ivspace;
    }
    delete image.ivtexture;
};
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
    if (type == gl.TEXTURE_CUBE_MAP) {
        var faces = [
            ["posx", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            ["negx", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            ["posy", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            ["negy", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            ["posz", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            ["negz", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
        ];
        t.ivnumfaces = 0;
        var _str = str.split(".");
        if (this.path) _str[0] = this.path + _str[0];
        for (var i = 0; i < 6; i++) {
            var filename = _str[0] + faces[i][0] + "." + _str[1];
            var image = new Image();
            image.ivtexture = t;
            image.ivface = faces[i][1];
            image.onload = function() {
                handleLoadedCubeTexture(this)
            };
            image.src = filename;
        }
    } else {
        t.image = new Image();
        t.image.ivtexture = t;
        t.image.onload = function() {
            handleLoadedTexture(this.ivtexture)
        };
        t.image.src = this.path ? this.path + str : str;
    }
    this.textures.push(t);
    return t;
};
space3d.prototype.newMaterial = function(n) {
    var mtl = new material3d(this);
    this.materials.push(mtl);
    if (n) mtl.name = name;
    return mtl;
};
space3d.prototype.load = function(data) {
    if (data) {
        if (data.space) {
            var s = data.space,
                m = s.meshes,
                i, j;
            var d = {
                objects: [],
                materials: [],
                space: this
            };
            if (s.materials) {
                if(s.materials == "IFC") {
                    d.materials = IFCMaterials.get(this);
                }
                else
                    for (i = 0; i < s.materials.length; i++) {
                        var mtl = this.newMaterial();
                        mtl.load(s.materials[i]);
                        d.materials.push(mtl);
                    }
            }
            if (m)
                for (i = 0; i < m.length; i++) {
                    meshSheet = this.meshSheets.add(m[i]);
                    for (j = 0; j < m[i].length; j++) {
                        var obj = new mesh3d(this.gl);
                        obj.meshSheet = meshSheet;
                        d.objects.push(obj);
                        meshSheet.objects.push(obj)
                    }
                }
            if (s.root) {
                if (!this.root) this.root = new node3d();
                this.root.load(s.root, d);
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
            if (data.space.bk != undefined) this.bk = new bk3d(this, data.space.bk);
            var w = this.window;
            if (w && w.onDataReady) w.onDataReady(this);
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
        this.c2(null);
    }
};
space3d.prototype.toRenderQueue = function(atm, node, state) {
    var mtl = this.cfgDefMtl ? this.cfgDefMtl : node.material;
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
        if (obj) obj.ref++;
    }
}
node3d.prototype.load = function(d, info) {
    var i, j;
    if (d.name !== undefined) this.name = d.name;
    if (d.meta !== undefined) this.meta = d.meta;
    if (d.meshSheet !== undefined) this.meshSheet = d.meshSheet;
    if (d.camera !== undefined) this.camera = d.camera;
    if (d.object != undefined) this.setObject(info.objects[d.object]);
    if(d.mtl == undefined && d.class != undefined) {
        d.mtl = d.class;
    }
    if (d.mtl != undefined) {
        if(info.materials.get)
            this.material = info.materials.get(d.mtl);
        else
            this.material = info.materials[d.mtl];
        if (this.material && this.material.bump && this.object) this.object.bump = true;
    }
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
    if (d.anim) this.anim = d.anim;
    if (d.i) {
        var n = d.i;
        for (i = 0; i < n.length; i++) {
            var node = this.newNode();
            node.load(n[i], info);
        }
    }
};

function nodeRender(node, tm, space, state) {
    var o = node.object;
    if (o) {
        if (o.meshSheet) {
            if (space.meshSheetsInQueue >= MAX_SIMULTANEOUS_AJAX_REQUESTS)
                return true; /* Don't hit the max! */
            if (o.meshSheet.request){
                delete o.meshSheet; /* Answer is on it's way! */
            }
            else {
                var url = o.meshSheet.ref;
                if(space.path)
                    url = space.path + url;
                var r = CreateRequest(url);
                if (r) {
                    o.meshSheet.request = r;
                    r.meshSheet = o.meshSheet;
                    space.meshSheetsInQueue++;
                    r.ivspace = space;
                    loadMeshSheet(r);
                    r.send();
                    delete o.meshSheet;
                }
            }
        } else {
            if (state & 4 && space.cfgSelZOffset) state |= 0x20000;
            if (o.boxMin) space.toRenderQueue(tm, node, state);
        }
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

function loadMeshSheet(request) {
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            if(data.constructor !== Array)
                data = [data];
            for(var i in this.meshSheet.objects) {
                ivobject = this.meshSheet.objects[i];
                ivobject.initialize(this.ivspace, data[i]);
                this.ivspace.onMeshLoaded(ivobject);
            }
            this.ivspace.meshSheets.remove(this.meshSheet);

            this.ivspace.meshSheetsInQueue--;
            if (!this.ivspace.meshSheetsInQueue) {
                var w = this.window;
                if (w && w.onMeshesReady) w.onMeshesReady(w, this);
            }
        }
    };

    request.onerror = function() {
        /*If there is an error, we'll try again later.*/
        this.meshSheet.request = null;
        this.meshSheet.objects[0].meshSheet = this.meshSheet; /*Set it back on at least 1 object!*/
        this.ivspace.meshSheetsInQueue--;
    };
}

function ivwindow3d(canvas, file, color, path) {
    this.canvas = canvas;
    canvas.ivwindow3d = this;
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
    this.autoRotate = true;
    this.orbitMode = 1;
    this.cameraMode = 0;
    this.bkColor = (color != undefined) ? color : 0x7f7f7f;
    this.initHardware();
    this.vpVersion = 0;
    this.timer = false;
    if (this.gl) {
        if (file) this.loadSpace(file, path);
        else this.space = null;
        this.gl.enable(this.gl.DEPTH_TEST);
        this.initHandlers();
        this.initEvents();
        this.invalidate();
    }
    if (window.performance && window.performance.now) this.getTickCount = getTickCountNew;
    else this.getTickCount = getTickCountLegacy;
}

function getTickCountNew() {
    return window.performance.now();
}

function getTickCountLegacy() {
    var d = new Date();
    var time = d.getTime();
    return time;
}

function indexOf(a, b) {
    var c = a.length;
    for (var i = 0; i < c; i++) {
        if (a[i] == b) return i;
    }
    return -1;
}
ivwindow3d.prototype.initHandlers = function() {
    var w = this;
    var i = {
        "move": function(event) {
            return w._onMouseMove(event);
        },
        "down": function(event) {
            return w.onMouseDown(event, false);
        },
        "up": function(event) {
            return w.onMouseUp(event, false);
        },
        "dbl": function(event) {
            return w._onDblClick(event);
        },
        "touchstart": function(event) {
            return w.onMouseDown(event, true);
        },
        "touchcancel": function(event) {
            return w.onTouchCancel(event);
        },
        "touchend": function(event) {
            return w.onMouseUp(event);
        },
        "touchmove": function(event) {
            return w.onTouchMove(event);
        },
        "menu": function(event) {
            return w._onContextMenu(event);
        },
        "wheel": function(event) {
            w.onMouseWheel(event);
        },
        "a": function() {
            w.animate();
        }
    };
    this.input = i;
}
ivwindow3d.prototype.initEvents = function() {
    var w = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel",
        c = this.canvas,
        i = this.input;
    this.setEvent(c, w, i.wheel);
    this.setEvent(c, "mousedown", i.down);
    this.setEvent(c, "mousemove", i.move);
    this.setEvent(c, "dblclick", i.dbl);
    this.setEvent(c, "contextmenu", i.menu);
    this.setEvent(c, "touchstart", i.touchstart);
    this.setEvent(c, "selectstart", function() {
        return false;
    });
}
ivwindow3d.prototype.releaseCapture = function() {
    if (this.mouseCaptured) {
        var e = this.canvas,
            i = this.input;
        if (e.releaseCapture) e.releaseCapture();
        else {
            e = document;
            this.delEvent(e, "mousemove", i.move);
            this.delEvent(e, "contextmenu", i.menu);
        }
        this.delEvent(e, "mouseup", i.up);
        this.delEvent(e, "touchmove", i.touchmove);
        this.delEvent(e, "touchend", i.touchend);
        this.delEvent(e, "touchcancel", i.touchcancel);
        this.mouseCaptured = false;
    }
}
ivwindow3d.prototype.setCapture = function() {
    if (!this.mouseCaptured) {
        var e = this.canvas,
            i = this.input;
        if (e.setCapture) e.setCapture();
        else {
            e = document;
            this.setEvent(e, "mousemove", i.move);
            this.setEvent(e, "contextmenu", i.menu);
        }
        this.setEvent(e, "mouseup", i.up);
        this.setEvent(e, "touchmove", i.touchmove);
        this.setEvent(e, "touchend", i.touchend);
        this.setEvent(e, "touchcancel", i.touchcancel);
        this.mouseCaptured = true;
    }
}
ivwindow3d.prototype.delEvent = function(d, e, f) {
    if (d.detachEvent) d.detachEvent("on" + e, f);
    else if (d.removeEventListener) d.removeEventListener(e, f);
}
ivwindow3d.prototype.setEvent = function(d, e, f) {
    if (d.attachEvent) d.attachEvent("on" + e, f);
    else if (d.addEventListener) d.addEventListener(e, f);
}
ivwindow3d.prototype.getWindow = function() {
    return this;
}
ivwindow3d.prototype.initHardware = function() {
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
ivwindow3d.prototype.getView = function(i) {
    if (i) i.update(this);
    else i = new viewInfo(this);
    return i;
}
ivwindow3d.prototype.setViewImp = function(v) {
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
ivwindow3d.prototype.setDefView = function() {
    this.removeAnimationType("spin");
    this.setViewImp(this.space.view);
    this.invalidate(IV.INV_VERSION);
}
ivwindow3d.prototype.loadSpace = function(file, path) {
    this.space = new space3d(this, this.gl);
    if (path != undefined) this.space.path = path;
    var r = CreateRequest(file, path);
    r.ivspace = this.space;
    r.ivwnd = this;
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            this.ivspace.load(JSON.parse(this.responseText));
            this.ivwnd.setDefView();
        }
    }
    r.send();
}
ivwindow3d.prototype.getDoubleSided = function() {
    return this.space.cfgDbl;
}
ivwindow3d.prototype.setDoubleSided = function(b) {
    if (this.space.cfgDbl != b) {
        var s = this.space;
        s.cfgDbl = b;
        s.invalidate(IV.INV_MTLS);
    }
}
ivwindow3d.prototype.setMaterials = function(b) {
    var s = this.space;
    if (b) {
        if (s.cfgDefMtl) {
            s.cfgDefMtl = null;
            this.invalidate();
        }
    } else {
        if (!s.cfgDefMtl) {
            var m = new material3d(s);
            m.load({
                "diffuse": 0xcccccc,
                "specular": 0x808080,
                "ambient": 0x050505,
                "phong": 25.6
            });
            s.cfgDefMtl = m;
            this.invalidate();
        };
    }
};
ivwindow3d.prototype.getTextures = function() {
    return this.space.cfgTextures;
}
ivwindow3d.prototype.setTextures = function(b) {
    if (this.space.cfgTextures != b) {
        this.space.cfgTextures = b;
        this.invalidate();
    }
}
ivwindow3d.prototype.setLights = function(l) {
    this.space.lights = l;
    this.invalidate(IV.INV_MTLS);
}
ivwindow3d.prototype.onMouseUp = function(event, touch) {
    var a = this.last;
    if (a) {
        if (this.autoRotate) {
            var dt = this.getTickCount() - a.t;
            if (dt < 200) this.addAnimation(new animationSpin(this, dt));
        }
        this.last = null;
    }
    this.releaseCapture();
};
ivwindow3d.prototype.getTouchDistance = function(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX,
        dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
ivwindow3d.prototype.getClientPoint = function(e, touch) {
    var r = this.canvas.getBoundingClientRect();
    var x, y;
    if (e) {
        if (touch && e.touches && e.touches.length) e = e.touches[0];
        x = e.clientX - r.left;
        y = e.clientY - r.top;
    } else {
        x = this.LX;
        y = this.LY;
    }
    return {
        "x": x,
        "y": y,
        "r": r
    }
}
ivwindow3d.prototype.decodeButtons = function(e, bt) {
    var btn = 0;
    if (bt && e.touches != undefined) {
        if (e.touches.length >= 3) return 4;
        return 1;
    }
    if (e.buttons == undefined) {
        if (e.which == 1) btn = 1;
        else
        if (e.which == 2) btn = 4;
        else
        if (e.which == 3) btn = 2;
        else btn = 1;
    } else btn = e.buttons;
    return btn;
}
ivwindow3d.prototype.pd = function(e) {
    if (e && e.preventDefault) e.preventDefault();
}
ivwindow3d.prototype._onContextMenu = function(event) {
    this.pd(event);
    if (this.mouseCancelPopup) {
        this.mouseCancelPopup = false;
        return false;
    }
    if (this.onContextMenu) this.onContextMenu(event);
    return true;
}
ivwindow3d.prototype._onDblClick = function(event) {
    if (this.onDblClick) this.onDblClick(event, false);
    this.pd(event);
    event.stopPropagation();
    return true;
}
ivwindow3d.prototype.onTouchMove = function(event) {
    this.onMouseMove(event, true);
    this.pd(event);
    return false;
}
ivwindow3d.prototype.onTouchCancel = function(event) {
    this.onMouseUp(event, true);
    if (event.cancelable) this.pd(event);
}
ivwindow3d.prototype._onMouseMove = function(event) {
    if (this.mouseCaptured) {
        var b = this.decodeButtons(event, false);
        if (b) this.onMouseMove(event, false);
        else this.onMouseUp(event, false);
        this.pd(event);
        event.stopPropagation();
        return true;
    } else {
        if (this.onMouseHover) this.onMouseHover(event);
    }
    return false;
}
ivwindow3d.prototype.onMouseDown = function(event, touch) {
    this.setCapture();
    this.removeAnimationType("spin");
    this.last = {
        x: 0,
        y: 0
    };
    var e = event;
    this.lastTouchDistance = -1;
    if (touch) {
        e = event.touches[0];
        if (event.touches.length == 2) this.lastTouchDistance = this.getTouchDistance(event);
    }
    var p = this.getClientPoint(e, touch);
    this.LX = p.x;
    this.LY = p.y;
    this.mouseMoved = false;
    p.b = this.decodeButtons(event, touch);
    this.pd(event);
}
ivwindow3d.prototype.onMouseMove = function(event, touch) {
    var e = event;
    var p = this.getClientPoint(e, touch);
    if (touch) {
        e = event.touches[0];
        if (event.touches.length == 2) {
            var d = this.getTouchDistance(event);
            if (this.lastTouchDistance != d) {
                if (this.lastTouchDistance > 0) {
                    var _d = this.lastTouchDistance - d;
                    this.doFOV(_d, _d);
                    this.invalidate(IV.INV_VERSION);
                }
                this.lastTouchDistance = d;
                this.mouseMoved = true;
                this.LX = p.x;
                this.LY = p.y;
            } else this.lastTouchDistance - 1;
            return;
        }
    }
    var dX = p.x - this.LX,
        dY = p.y - this.LY;
    if (this.mouseMoved || Math.abs(dX) || Math.abs(dY)) {
        var b = p.b = this.decodeButtons(event, touch);
        var invF = 0;
        if (this.cameraMode && b == 1) {
            if (this.cameraMode == 1) b = 2;
            else
            if (this.cameraMode == 2) b = 4;
        }
        if (b & 4) {
            this.doPan(dX, dY);
            invF = IV.INV_VERSION;
        } else
        if (b & 1) {
            var a = this.last;
            if (a) {
                a.x = dX + a.x / 2;
                a.y = dY + a.y / 2;
                var t = this.getTickCount();
                a.dt = t - a.t;
                a.t = t;
            }
            this.doOrbit(dX, dY);
            invF = IV.INV_VERSION;
        } else
        if (b & 2) {
            if (!this.doFOV(dX, dY)) return;
            invF = IV.INV_VERSION;
            this.mouseCancelPopup = true;
        }
        this.invalidate();
        this.LX = p.x;
        this.LY = p.y;
        this.mouseMoved = true;
    }
}
ivwindow3d.prototype.onMouseWheel = function(event) {
    var d;
    if (event.wheelDelta != undefined) d = event.wheelDelta / -10;
    else
    if (event.detail != undefined) {
        d = event.detail;
        if (d > 10) d = 10;
        else if (d < -10) d = -10;
        d *= 4;
    }
    this.doDolly(0, d);
    this.invalidate(IV.INV_VERSION);
    this.pd(event);
}
ivwindow3d.prototype.doPan = function(dX, dY) {
    var v = this.getView();
    var gl = this.gl;
    var x0 = gl.viewportWidth / 2,
        y0 = gl.viewportHeight / 2;
    var r0 = this.getRay(x0, y0);
    var r1 = this.getRay(x0 - dX, y0 - dY);
    var d = [r1[3] - r0[3], r1[4] - r0[4], r1[5] - r0[5]];
    vec3.add_ip(v.from, d);
    vec3.add_ip(v.up, d);
    vec3.add_ip(v.to, d);
    this.setViewImp(v);
}
ivwindow3d.prototype.doOrbit = function(dX, dY) {
    var v = this.getView(),
        tm = [];
    var _u = v.getUpVector();
    if (dX && this.orbitMode) {
        mat4.identity(tm);
        mat4.rotateAxisOrg(tm, v.to, _u, -dX / 200.0);
        mat4.mulPoint(tm, v.from);
        mat4.mulPoint(tm, v.up);
        dX = 0;
    }
    if (dY) {
        vec3.normalize(_u);
        var _d = v.getViewVectorN();
        var _axis = vec3.cross(_d, _u, _axis);
        mat4.identity(tm);
        mat4.rotateAxisOrg(tm, v.to, _axis, -dY / 200.0);
        mat4.mulPoint(tm, v.from);
        mat4.mulPoint(tm, v.up);
    }
    if (dX) {
        _u = [0, 0, 1];
        mat4.identity(tm);
        mat4.rotateAxisOrg(tm, v.to, _u, -dX / 200.0);
        mat4.mulPoint(tm, v.from);
        mat4.mulPoint(tm, v.up);
    }
    this.setViewImp(v);
}
ivwindow3d.prototype.doDolly = function(dX, dY) {
    var v = this.getView();
    var dir = vec3.sub_r(v.from, v.to);
    var l = vec3.length(dir);
    var _l = l + l * dY / 100;
    if (_l < 1e-6) return false;
    vec3.scale_ip(dir, _l / l);
    var _new = vec3.add_r(v.to, dir);
    var delta = vec3.sub_r(_new, v.from);
    vec3.add_ip(v.from, delta);
    vec3.add_ip(v.up, delta);
    this.setViewImp(v);
    return true;
}
ivwindow3d.prototype.doFOV = function(dX, dY) {
    var fov = this.fov + dY / 8;
    if (fov >= 175) fov = 175;
    else
    if (fov <= 1) fov = 1;
    if (fov != this.fov) {
        this.fov = fov;
        return true;
    }
    return false;
}
ivwindow3d.prototype.getUpVector = function() {
    return vec3.sub_r(this.viewUp, this.viewFrom);
}
ivwindow3d.prototype.getRay = function(x, y, ray) {
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
ivwindow3d.prototype.updateMVTM = function() {
    mat4.lookAt(this.viewFrom, this.viewTo, this.getUpVector(), this.mvMatrix);
}
ivwindow3d.prototype.drawScene = function() {
    var gl = this.gl;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    if (this.space.bk == undefined || (!this.space.drawBk())) {
        var bk = this.bkColor;
        var r = ((bk >> 16) & 0xff) / 255.0;
        var g = ((bk >> 8) & 0xff) / 255.0;
        var b = (bk & 0xff) / 255.0;
        gl.clearColor(r, g, b, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    this.updateMVTM();
    this.space.render(this.mvMatrix);
    this.timer = false;
}
ivwindow3d.prototype.invalidate = function(f) {
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
}
ivwindow3d.prototype.animate = function() {
    var j = 0,
        rez = 0,
        uFlags = 0,
        inv = false,
        bKill = true;
    var time = this.getTickCount();
    var _i = this.transitions;
    while (j < _i.length) {
        var i = _i[j];
        var bDel = false;
        if (i.lastTime != time) {
            if (i.duration) {
                var a = (time - i.startTime) / i.duration;
                if ((a >= 1.0) || (a < 0)) {
                    a = 1.0;
                    bDel = true;
                }
                rez = i.animate(a);
            } else {
                rez = i.animate(time - i.lastTime);
                if (!(rez & 1)) bDel = true;
            }
            i.lastTime = time;
        }
        if (rez & 2) inv = true;
        if (rez & 4) uFlags |= IV.INV_VERSION;
        if (bDel) {
            _i.splice(j, 1);
            if (i.detach) i.detach(this);
        } else j++;
    }
    if (inv) this.invalidate(uFlags);
    if (!_i.length) {
        clearInterval(this.transTimer);
        this.transTimer = null;
    }
}
ivwindow3d.prototype.getAnimation = function(type) {
    var _i = this.transitions;
    if (_i) {
        for (var i = 0; i < _i.length; i++) {
            var t = _i[i];
            if (t.type && t.type == type) return i;
        }
    }
    return -1;
};
ivwindow3d.prototype.removeAnimationType = function(type) {
    var _i = this.transitions;
    if (_i) {
        for (var i = 0; i < _i.length; i++) {
            var t = _i[i];
            if (t.type && t.type == type) {
                if (t.detach) t.detach(this);
                _i.splice(i, 1);
                return true;
            }
        }
    }
    return false;
};
ivwindow3d.prototype.removeAnimation = function(a) {
    var _i = this.transitions;
    if (_i) {
        var i = indexOf(_i, a);
        if (i > -1) {
            if (a.detach) a.detach(this);
            _i.splice(i, 1);
            return true;
        }
    }
    return false;
}
ivwindow3d.prototype.addAnimation = function(i) {
    i.lastTime = this.getTickCount();
    if (i.duration) i.startTime = i.lastTime;
    if (!this.transitions) this.transitions = [];
    this.transitions.push(i);
    if (!this.transTimer) {
        var w = this;
        this.transTimer = setInterval(this.input.a, 10);
    }
};

function animationSpin(wnd, t) {
    this.type = "spin";
    this.wnd = wnd;
    var a = wnd.last;
    var k = this.kf(a.dt);
    this.x = a.x * k;
    this.y = a.y * k;
}
animationSpin.prototype.kf = function(a) {
    return Math.pow(0.82, a / 100);
}
animationSpin.prototype.animate = function(a) {
    this.wnd.doOrbit(this.x, this.y);
    var k = this.kf(a);
    this.x *= k;
    this.y *= k;
    k = 1e-1;
    if ((Math.abs(this.x) < k) && (Math.abs(this.y) < k)) return 6;
    return 7;
}