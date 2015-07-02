/*
* Reversed from http://www.finalmesh.com/webglmore.htm
*
* Added:
*   - MeshSheet system (for cases in between the single-json-file and the one-json-file-per-product)
*   - Error handling for failed AJAX queries (e.g. too many queries)
*   - A maximum of simultaneous requests to prevent the errors from happening in the first place.
*/

var MAX_SIMULTANEOUS_AJAX_REQUESTS = 100;

glMatrixArrayType = typeof Float32Array != "undefined" ? Float32Array : typeof WebGLFloatArray != "undefined" ? WebGLFloatArray : Array;
var vec3 = {};
vec3.create = function(a) {
    var b = new glMatrixArrayType(3);
    if (a) {
        b[0] = a[0];
        b[1] = a[1];
        b[2] = a[2]
    }
    return b
};
vec3.set = function(a, b) {
    b[0] = a[0];
    b[1] = a[1];
    b[2] = a[2];
    return b
};
vec3.add = function(a, b, c) {
    if (!c || a == c) {
        a[0] += b[0];
        a[1] += b[1];
        a[2] += b[2];
        return a
    }
    c[0] = a[0] + b[0];
    c[1] = a[1] + b[1];
    c[2] = a[2] + b[2];
    return c
};
vec3.subtract = function(a, b, c) {
    if (!c || a == c) {
        a[0] -= b[0];
        a[1] -= b[1];
        a[2] -= b[2];
        return a
    }
    c[0] = a[0] - b[0];
    c[1] = a[1] - b[1];
    c[2] = a[2] - b[2];
    return c
};
vec3.scale = function(a, b, c) {
    if (!c || a == c) {
        a[0] *= b;
        a[1] *= b;
        a[2] *= b;
        return a
    }
    c[0] = a[0] * b;
    c[1] = a[1] * b;
    c[2] = a[2] * b;
    return c
};
vec3.normalize = function(a, b) {
    b || (b = a);
    var c = a[0],
        d = a[1],
        e = a[2],
        g = Math.sqrt(c * c + d * d + e * e);
    if (g) {
        if (g == 1) {
            b[0] = c;
            b[1] = d;
            b[2] = e;
            return b
        }
    } else {
        b[0] = 0;
        b[1] = 0;
        b[2] = 0;
        return b
    }
    g = 1 / g;
    b[0] = c * g;
    b[1] = d * g;
    b[2] = e * g;
    return b
};
vec3.cross = function(a, b, c) {
    c || (c = a);
    var d = a[0],
        e = a[1];
    a = a[2];
    var g = b[0],
        f = b[1];
    b = b[2];
    c[0] = e * b - a * f;
    c[1] = a * g - d * b;
    c[2] = d * f - e * g;
    return c
};
vec3.length = function(a) {
    var b = a[0],
        c = a[1];
    a = a[2];
    return Math.sqrt(b * b + c * c + a * a)
};
vec3.dot = function(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
};
vec3.subtractN = function(a, b, c) {
    return vec3.normalize(vec3.subtract(a, b, c));
}
var mat3 = {};
mat3.create = function(a) {
    var b = new glMatrixArrayType(9);
    if (a) {
        b[0] = a[0];
        b[1] = a[1];
        b[2] = a[2];
        b[3] = a[3];
        b[4] = a[4];
        b[5] = a[5];
        b[6] = a[6];
        b[7] = a[7];
        b[8] = a[8];
        b[9] = a[9]
    }
    return b
};
mat3.identity = function(a) {
    a[0] = 1;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 1;
    a[5] = 0;
    a[6] = 0;
    a[7] = 0;
    a[8] = 1;
    return a
};
var mat4 = {};
mat4.create = function(a) {
    var b = new glMatrixArrayType(16);
    if (a) {
        b[0] = a[0];
        b[1] = a[1];
        b[2] = a[2];
        b[3] = a[3];
        b[4] = a[4];
        b[5] = a[5];
        b[6] = a[6];
        b[7] = a[7];
        b[8] = a[8];
        b[9] = a[9];
        b[10] = a[10];
        b[11] = a[11];
        b[12] = a[12];
        b[13] = a[13];
        b[14] = a[14];
        b[15] = a[15]
    }
    return b
};
mat4.identity = function(a) {
    a[0] = 1;
    a[1] = 0;
    a[2] = 0;
    a[3] = 0;
    a[4] = 0;
    a[5] = 1;
    a[6] = 0;
    a[7] = 0;
    a[8] = 0;
    a[9] = 0;
    a[10] = 1;
    a[11] = 0;
    a[12] = 0;
    a[13] = 0;
    a[14] = 0;
    a[15] = 1;
    return a
};
mat4.m = function(b, a, c) {
    c || (c = b);
    var d = a[0],
        e = a[1],
        g = a[2],
        f = a[3],
        h = a[4],
        i = a[5],
        j = a[6],
        k = a[7],
        l = a[8],
        o = a[9],
        m = a[10],
        n = a[11],
        p = a[12],
        r = a[13],
        s = a[14];
    a = a[15];
    var A = b[0],
        B = b[1],
        t = b[2],
        u = b[3],
        v = b[4],
        w = b[5],
        x = b[6],
        y = b[7],
        z = b[8],
        C = b[9],
        D = b[10],
        E = b[11],
        q = b[12],
        F = b[13],
        G = b[14];
    b = b[15];
    c[0] = A * d + B * h + t * l + u * p;
    c[1] = A * e + B * i + t * o + u * r;
    c[2] = A * g + B * j + t * m + u * s;
    c[3] = A * f + B * k + t * n + u * a;
    c[4] = v * d + w * h + x * l + y * p;
    c[5] = v * e + w * i + x * o + y * r;
    c[6] = v * g + w * j + x * m + y * s;
    c[7] = v * f + w * k + x * n + y * a;
    c[8] = z * d + C * h + D * l + E * p;
    c[9] = z * e + C * i + D * o + E * r;
    c[10] = z *
        g + C * j + D * m + E * s;
    c[11] = z * f + C * k + D * n + E * a;
    c[12] = q * d + F * h + G * l + b * p;
    c[13] = q * e + F * i + G * o + b * r;
    c[14] = q * g + F * j + G * m + b * s;
    c[15] = q * f + F * k + G * n + b * a;
    return c
};
mat4.mulPoint = function(a, b, c) {
    c || (c = b);
    var d = b[0],
        e = b[1];
    b = b[2];
    c[0] = a[0] * d + a[4] * e + a[8] * b + a[12];
    c[1] = a[1] * d + a[5] * e + a[9] * b + a[13];
    c[2] = a[2] * d + a[6] * e + a[10] * b + a[14];
    return c
};
mat4.mulVector = function(a, b, c) {
    c || (c = b);
    var d = b[0],
        e = b[1];
    b = b[2];
    c[0] = a[0] * d + a[4] * e + a[8] * b;
    c[1] = a[1] * d + a[5] * e + a[9] * b;
    c[2] = a[2] * d + a[6] * e + a[10] * b;
    return c
};
mat4.rotate = function(a, b, c, d) {
    var e = c[0],
        g = c[1];
    c = c[2];
    var f = Math.sqrt(e * e + g * g + c * c);
    if (!f) return null;
    if (f != 1) {
        f = 1 / f;
        e *= f;
        g *= f;
        c *= f
    }
    var h = Math.sin(b),
        i = Math.cos(b),
        j = 1 - i;
    b = a[0];
    f = a[1];
    var k = a[2],
        l = a[3],
        o = a[4],
        m = a[5],
        n = a[6],
        p = a[7],
        r = a[8],
        s = a[9],
        A = a[10],
        B = a[11],
        t = e * e * j + i,
        u = g * e * j + c * h,
        v = c * e * j - g * h,
        w = e * g * j - c * h,
        x = g * g * j + i,
        y = c * g * j + e * h,
        z = e * c * j + g * h;
    e = g * c * j - e * h;
    g = c * c * j + i;
    if (d) {
        if (a != d) {
            d[12] = a[12];
            d[13] = a[13];
            d[14] = a[14];
            d[15] = a[15]
        }
    } else d = a;
    d[0] = b * t + o * u + r * v;
    d[1] = f * t + m * u + s * v;
    d[2] = k * t + n * u + A * v;
    d[3] = l * t + p * u + B *
        v;
    d[4] = b * w + o * x + r * y;
    d[5] = f * w + m * x + s * y;
    d[6] = k * w + n * x + A * y;
    d[7] = l * w + p * x + B * y;
    d[8] = b * z + o * e + r * g;
    d[9] = f * z + m * e + s * g;
    d[10] = k * z + n * e + A * g;
    d[11] = l * z + p * e + B * g;
    return d
};
mat4.frustum = function(a, b, c, d, e, g, f) {
    f || (f = mat4.create());
    var h = b - a,
        i = d - c,
        j = g - e;
    f[0] = e * 2 / h;
    f[1] = 0;
    f[2] = 0;
    f[3] = 0;
    f[4] = 0;
    f[5] = e * 2 / i;
    f[6] = 0;
    f[7] = 0;
    f[8] = (b + a) / h;
    f[9] = (d + c) / i;
    f[10] = -(g + e) / j;
    f[11] = -1;
    f[12] = 0;
    f[13] = 0;
    f[14] = -(g * e * 2) / j;
    f[15] = 0;
    return f
};
mat4.perspective = function(a, b, c, d, e) {
    a = c * Math.tan(a * Math.PI / 360);
    b = a * b;
    return mat4.frustum(-b, b, -a, a, c, d, e)
};
mat4.ortho = function(a, b, c, d, e, g, f) {
    f || (f = mat4.create());
    var h = b - a,
        i = d - c,
        j = g - e;
    f[0] = 2 / h;
    f[1] = 0;
    f[2] = 0;
    f[3] = 0;
    f[4] = 0;
    f[5] = 2 / i;
    f[6] = 0;
    f[7] = 0;
    f[8] = 0;
    f[9] = 0;
    f[10] = -2 / j;
    f[11] = 0;
    f[12] = -(a + b) / h;
    f[13] = -(d + c) / i;
    f[14] = -(g + e) / j;
    f[15] = 1;
    return f
};
mat4.lookAt = function(a, b, c, d) {
    d || (d = mat4.create());
    var e = a[0],
        g = a[1];
    a = a[2];
    var f = c[0],
        h = c[1],
        i = c[2];
    c = b[1];
    var j = b[2];
    if (e == b[0] && g == c && a == j) return mat4.identity(d);
    var k, l, o, m;
    c = e - b[0];
    j = g - b[1];
    b = a - b[2];
    m = 1 / Math.sqrt(c * c + j * j + b * b);
    c *= m;
    j *= m;
    b *= m;
    k = h * b - i * j;
    i = i * c - f * b;
    f = f * j - h * c;
    if (m = Math.sqrt(k * k + i * i + f * f)) {
        m = 1 / m;
        k *= m;
        i *= m;
        f *= m
    } else f = i = k = 0;
    h = j * f - b * i;
    l = b * k - c * f;
    o = c * i - j * k;
    if (m = Math.sqrt(h * h + l * l + o * o)) {
        m = 1 / m;
        h *= m;
        l *= m;
        o *= m
    } else o = l = h = 0;
    d[0] = k;
    d[1] = h;
    d[2] = c;
    d[3] = 0;
    d[4] = i;
    d[5] = l;
    d[6] = j;
    d[7] = 0;
    d[8] = f;
    d[9] =
        o;
    d[10] = b;
    d[11] = 0;
    d[12] = -(k * e + i * g + f * a);
    d[13] = -(h * e + l * g + o * a);
    d[14] = -(c * e + j * g + b * a);
    d[15] = 1;
    return d
};
vec3.sub_ip = function(a, b) {
    a[0] -= b[0];
    a[1] -= b[1];
    a[2] -= b[2];
}
vec3.sub_r = function(a, b) {
    var d = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    return d;
}
vec3.cpy = function(dst, src) {
    dst[0] = src[0];
    dst[1] = src[1];
    dst[2] = src[2];
}
vec3.add_ip = function(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
}
vec3.add_r = function(a, b) {
    var d = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    return d;
}
vec3.scale_ip = function(a, b) {
    a[0] *= b;
    a[1] *= b;
    a[2] *= b;
}
vec3.scale_r = function(a, b) {
    var d = [a[0] * b, a[1] * b, a[2] * b];
    return d;
}
vec3.cross_r = function(a, b) {
    var d = a[0],
        e = a[1];
    a = a[2];
    var g = b[0],
        f = b[1];
    b = b[2];
    var c = [e * b - a * f, a * g - d * b, d * f - e * g];
    return c;
}
vec3.cross_rn = function(a, b) {
    var c = vec3.cross_r(a, b);
    vec3.normalize(c);
    return c;
}
vec3.lerp_r = function(a, b, c) {
    var d = [a[0] + c * (b[0] - a[0]), a[1] + c * (b[1] - a[1]), a[2] + c * (b[2] - a[2])];
    return d
};
vec3.compare = function(a, b, e) {
    return (Math.abs(a[0] - b[0]) < e) && (Math.abs(a[1] - b[1]) < e) && (Math.abs(a[2] - b[2]) < e);
};
vec3.cross_normalize = function(a, b, c) {
    c || (c = a);
    var d = a[0],
        e = a[1];
    a = a[2];
    var g = b[0],
        f = b[1];
    b = b[2];
    var x = e * b - a * f,
        y = a * g - d * b,
        z = d * f - e * g;
    g = Math.sqrt(x * x + y * y + z * z);
    if (g) {
        if (g == 1) {
            c[0] = x;
            c[1] = y;
            c[2] = z;
        } else {
            g = 1 / g;
            c[0] = x * g;
            c[1] = y * g;
            c[2] = z * g;
        }
    } else {
        c[0] = 0;
        c[1] = 0;
        c[2] = 0;
    }
    return c;
};
mat4.offset = function(tm, offset) {
    tm[12] += offset[0];
    tm[13] += offset[1];
    tm[14] += offset[2];
}
mat4.copy = function(src, dst) {
    for (var i = 0; i < 16; i++) dst[i] = src[i];
}
mat4.rotateAxisOrg = function(tm, org, axis, angle) {
    var _org = [-org[0], -org[1], -org[2]];
    mat4.offset(tm, _org);
    var tmR = mat4.create();
    var tm2 = mat4.create();
    mat4.identity(tmR);
    mat4.rotate(tmR, angle, axis);
    mat4.m(tm, tmR, tm2);
    mat4.copy(tm2, tm);
    mat4.offset(tm, org);
}
mat4.setRow = function(tm, index, p) {
    index *= 4;
    tm[index] = p[0];
    tm[index + 1] = p[1];
    tm[index + 2] = p[2];
};
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
}
space3d.prototype.newMaterial = function(n) {
    var mtl = new material3d(this);
    this.materials.push(mtl);
    if (n) mtl.name = name;
    return mtl;
}
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
            if (s.materials)
                for (i = 0; i < s.materials.length; i++) {
                    var mtl = this.newMaterial();
                    mtl.load(s.materials[i]);
                    d.materials.push(mtl);
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
}
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
space3d.prototype.getMaterial = function(name) {
    var it = this.materials;
    for (var i = 0; i < it.length; i++) {
        var m = it[i];
        if ((m.name !== undefined) && m.name == name) return m;
    }
    return null;
};

function channel3d() {
    this.mode = 0;
    this.color = null;
    this.texture = null;
}

function mtlvar3d(id, ord) {
    this.id = id;
    this.ord = ord;
    this.slot = null;
}

function shader3d(m, f) {
    this.mtl = m;
    this.flags = f;
    this.bValid = false;
    this.attrs = [];
    this.vars = [];
    this.textures = [];
    this.program = null;
    this.vShader = null;
    this.fShader = null;
    this.loadedtextures = 0;
    this.numLights = 0;
};

function material3d(space) {
    this.space = space;
    this.gl = space.gl;
    this.type = "standard";
    this.shaders = [];
    this.phong = 18;
}
channel3d.prototype.setColor = function(clr) {
    if (!this.color) this.color = [0, 0, 0];
    var c = this.color;
    var t = typeof clr;
    if (t === 'number') {
        c[0] = ((clr >> 16) & 0xff) / 255;
        c[1] = ((clr >> 8) & 0xff) / 255;
        c[2] = (clr & 0xff) / 255;
    } else {
        c[0] = clr[0];
        c[1] = clr[1];
        c[2] = clr[2];
    }
}
material3d.prototype.invalidate = function() {
    var s = this.shaders;
    if (s) {
        for (var i = 0; i < s.length; i++) s[i].detach(this.gl);
        this.shaders = [];
    }
}
material3d.prototype.reset = function() {
    if (this.diffuse) delete this.diffuse;
    if (this.specular) delete this.specular;
    if (this.emissive) delete this.emissive;
    if (this.reflection) delete this.reflection;
    if (this.bump) delete this.bump;
    if (this.opacity) delete this.opacity;
    this.invalidate();
}
material3d.prototype.isChannel = function(c) {
    if ((c === undefined) || (c === null)) return false;
    if (c.length === 0) return false;
    for (var i = 0; i < c.length; i++) {
        var item = c[i];
        if (item.texture != null || item.color != null || item.amount != null) return true;
    }
    return false;
}
material3d.prototype.newChannel = function(type, ch) {
    if (!ch) ch = new channel3d();
    if (!(type in this)) this[type] = [];
    this[type].push(ch);
    this.bValid = false;
    return ch;
}
material3d.prototype.getChannel = function(type) {
    if (!(type in this)) return null;
    var items = this[type];
    return items[0];
}
material3d.prototype.newTexture = function(c, name, type) {
    var gl = this.gl;
    if (type === undefined) type = gl.TEXTURE_2D;
    c.texture = this.space.getTexture(name, type);
    if (type == gl.TEXTURE_CUBE_MAP) c.wrapT = c.wrapS = gl.CLAMP_TO_EDGE;
    else {
        if (!c.wrapS) c.wrapS = gl.REPEAT;
        if (!c.wrapT) c.wrapT = gl.REPEAT;
    }
}
material3d.prototype.cnvTtxMatrix = function(a) {
    var tm = mat3.create();
    var index = 0;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 2; j++) {
            tm[i * 3 + j] = a[index];
            index++;
        }
    }
    tm[2] = 0;
    tm[5] = 0;
    tm[8] = 1;
    return tm;
}
material3d.prototype.loadChannelImp = function(v, name) {
    var c = this.newChannel(name);
    if (v.color !== undefined) c.setColor(v.color);
    if (v.amount !== undefined) c.amount = v.amount;
    if (v.texture !== undefined) {
        var type = undefined;
        if (("type" in v) && v.type == "cube") {
            if (this.gl) type = this.gl.TEXTURE_CUBE_MAP;
            else type = 0x8513;
        }
        if (v.tm) c.tm = this.cnvTtxMatrix(v.tm);
        if (v.cmp) c.cmp = v.cmp;
        if (v.filter) c.filter = v.filter;
        if (v.blend) c.blend = v.blend;
        if (v.wrapT) c.wrapT = v.wrapT;
        if (v.wrapS) c.wrapS = v.wrapS;
        this.newTexture(c, v.texture, type);
    }
}
material3d.prototype.loadChannel = function(v, name) {
    var type = typeof v;
    if (type === "number") {
        var c = this.newChannel(name);
        if (name == 'opacity') c.amount = v;
        else c.setColor(v);
    } else
    if (type === "object") {
        if (v instanceof Array) {
            var len = v.length;
            if ((len == 3) && (typeof v[0] == 'number') && (typeof v[1] == 'number') && (typeof v[2] == 'number')) {
                var c = this.newChannel(name);
                c.setColor(v);
            } else {
                for (var i = 0; i < len; i++) this.loadChannelImp(v[i], name);
            }
        } else this.loadChannelImp(v, name);
    }
};
material3d.prototype.load = function(d) {
    for (var v in d) {
        var a = d[v];
        switch (v) {
            case "diffuse":
            case "specular":
            case "emissive":
            case "reflection":
            case "opacity":
            case "bump":
                this.loadChannel(a, v);
                break;
            case "name":
                this.name = a;
                break;
            case "phong":
                this.phong = a;
                break;
            case "backSide":
                this.backSide = a;
                break;
        }
    }
    return true;
}
material3d.prototype.getShader = function(flags) {
    flags &= ~256;
    if (!this.space.cfgTextures) flags &= ~2;
    for (var i = 0; i < this.shaders.length; i++) {
        var s = this.shaders[i];
        if (s.flags == flags) {
            if ((s.loadedtextures != s.textures.length) && s.bValid) {
                var c = s.readyTextures(false);
                if (c != s.loadedtextures) s.bValid = false;
            }
            if (s.numLights != this.space.lights.length) s.bValid = false;
            return s;
        }
    }
    var s = new shader3d(this, flags);
    this.shaders.push(s);
    return s;
}
shader3d.prototype.addVar = function(id, ord) {
    var v = new mtlvar3d(id, ord);
    this.vars.push(v);
    return v;
}
shader3d.prototype.addAttr = function(id, shName, gl) {
    var attr = {};
    attr.id = id;
    attr.slot = gl.getAttribLocation(this.program, shName);
    gl.enableVertexAttribArray(attr.slot);
    this.attrs.push(attr);
}
shader3d.prototype.addLightVar = function(id, name, light, ord) {
    var v = this.addVar(id, ord);
    v.name = name;
    v.light = light;
    return v;
}
shader3d.prototype.addChVar = function(id, name, ch, ord) {
    var v = this.addVar(id, ord);
    v.name = name;
    v.channel = ch;
    return v;
}
shader3d.prototype.compareTM3 = function(a, b) {
    if (a === undefined && b === undefined) return true;
    if (a === undefined || b === undefined) return false;
    for (var i = 0; i < 9; i++)
        if (Math.abs(a[i] - b[i]) > 1e-4) return false;
    return true;
}
shader3d.prototype.getTexture = function(c) {
    var items = this.textures;
    for (var j = 0; j < items.length; j++) {
        var t = items[j];
        if (t.txt === c.texture && (t.wrapS == c.wrapS) && (t.wrapT == c.wrapT) && this.compareTM3(t.tm, c.tm)) return t;
    }
    return null;
}
shader3d.prototype.preChannel = function(ch, ft) {
    var text = "";
    for (var i = 0; i < ch.length; i++) {
        var c = ch[i];
        c._id = this.channelId;
        this.channelId++;
        if (c.color != null) {
            var name = "ch" + c._id + "clr";
            this.addChVar("color", name, c, 4102);
            text += "uniform vec3 " + name + ";\r\n";
        }
        if ("amount" in c) {
            var name = "ch" + c._id + "amount";
            this.addChVar("amount", name, c, 4104);
            text += "uniform float " + name + ";\r\n";
        }
    }
    ft.push(text);
};
shader3d.prototype.handleChannel = function(gl, ch, cmp, ft) {
    var text = "";
    var text2 = "";
    for (var i = 0; i < ch.length; i++) {
        var c = ch[i];
        var cname = null;
        var tname = null;
        var aname = null;
        if (c.color != null) {
            cname = "ch" + c._id + "clr";
        }
        if (c.texture != null && c.texture.ivready) {
            var t = this.getTexture(c);
            if (t) {
                if (c.texture.ivtype == gl.TEXTURE_CUBE_MAP) {
                    text += "vec3 lup=reflect(eyeDirection,normal);lup.y*=-1.0;vec4 refColor=" + "textureCube(txtUnit" + t.slot + ",lup);";
                    tname = "refColor";
                } else {
                    tname = "txtColor" + t.slot;
                }
            }
        }
        if (tname && c.amount != null) {
            aname = "ch" + c._id + "amount";
        }
        if (cname || tname) {
            var local = null;
            if (aname && tname) local = "vec3(" + aname + ")*vec3(" + tname + ")";
            else
            if (cname && tname) local = cname + "*vec3(" + tname + ")";
            else
            if (cname) local = cname;
            else local = "vec3(" + tname + ")";
            if (text2.length) {
                text2 = "(" + text2 + ")" + this.getBlend(c) + local;
            } else text2 = local;
        }
    }
    if (text.length) ft.push(text + "\r\n");
    if (text2) {
        if (cmp) text2 = cmp + "*=" + text2;
        else text2 = "color+=" + text2;
        ft.push(text2 + ";");
    }
    if (cmp) ft.push("color+=" + cmp + ";");
};
shader3d.prototype.getBlend = function(c) {
    var blend;
    switch (c.blend) {
        case "sub":
            blend = "-";
            break;
        case "mul":
            blend = "*";
            break;
        default:
            blend = "+";
            break;
    }
    return blend;
}
shader3d.prototype.handleAlphaChannel = function(gl, ch, ft) {
    if (ch && ch.length) {
        var txt = null;
        var tAlpha = false;
        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            var tname = null;
            var aname = null;
            if (c.texture != null && c.texture.ivready) {
                var t = this.getTexture(c);
                if (t) tname = "txtColor" + t.slot;
            }
            if (c.amount != null) {
                aname = "ch" + c._id + "amount";
            }
            if (tname) {
                if (aname) t = aname + "*";
                else t = "";
                if (c.cmp && c.cmp == 'a') t += tname + ".a";
                else
                    t += "(" + tname + ".x+" + tname + ".y+" + tname + ".z)/3.0";
            } else
            if (aname) t = aname;
            if (t) {
                if (txt) {
                    if (!tAlpha) {
                        txt = "float alpha=" + txt + ";\n";
                        tAlpha = true;
                    }
                    txt += "alpha" + this.getBlend(c) + '=' + t + ";\n";
                } else txt = t;
            }
        }
        if (txt) {
            if (tAlpha) {
                ft.push(txt);
                return "alpha";
            } else return txt;
        }
    }
    return "1.0";
}
shader3d.prototype.handleBumpChannel = function(gl, ch) {
    if (ch && ch.length) {
        var c = ch[0];
        if (c.texture != null && c.texture.ivready) {
            var t = this.getTexture(c);
            if (t) {
                if (c.texture) {
                    var tname = "txtColor" + t.slot;
                    var text = "\r\nvec3 _n=vec3(" + tname + ");";
                    text += "_n-=vec3(0.5,0.5,0);_n*=vec3(2.0,2.0,1.0);";
                    if (c.amount != null) {
                        var aname = "ch" + c._id + "amount";
                        text += "_n*=vec3(" + aname + "," + aname + ",1.0);";
                    }
                    text += "_n=normalize(_n);";
                    return text;
                }
            }
        }
    }
    return null;
}
shader3d.prototype.c0 = function(ch) {
    var rez = false;
    if (ch) {
        for (var i = 0; i < ch.length; i++) {
            var c = ch[i];
            if (c.texture) {
                if (!this.getTexture(c)) {
                    var t = {
                        "txt": c.texture,
                        "slot": 0,
                        "wrapS": c.wrapS,
                        "wrapT": c.wrapT
                    };
                    if (c.tm) {
                        t.tm = c.tm;
                        t.ch = c;
                    }
                    this.textures.push(t);
                }
                if (c.texture.ivready) rez = true;
            }
        }
    }
    return rez;
}
shader3d.prototype.readyTextures = function(bSet) {
    var c = 0;
    for (var i = 0; i < this.textures.length; i++) {
        var t = this.textures[i];
        if (t.txt.ivready) {
            if (bSet) t.slot = c;
            c++;
        }
    }
    return c;
}
shader3d.prototype.compile = function(gl, i, type) {
    var str = i.join('');
    var shader = gl.createShader(type);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(str + "\r\n" + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
shader3d.prototype.fetchTextures = function(gl, ft) {
    var _i = this.textures;
    var a = 0;
    for (i = 0; i < _i.length; i++) {
        var t = _i[i];
        if (t.txt.ivready && t.txt.ivtype == gl.TEXTURE_2D) {
            if (t.tm) {
                var s = "_uv=vec2(ch" + t.ch._id + "tm*vec3(vUV,1.0));\n";
                ft.push((a ? "" : "vec2 ") + s);
                a++;
            }
            ft.push("vec4 txtColor" + t.slot + "=texture2D(txtUnit" + t.slot + "," + ((t.tm) ? "_uv" : "vUV") + ");");
        }
    }
}
shader3d.prototype.update = function(mtl) {
    mtl = this.mtl;
    if (this.program) this.detach(mtl.gl);
    this.numLights = mtl.space.lights.length;
    this.channelId = 0;
    var gl = mtl.gl,
        i;
    var _lights = null;
    var vt = [];
    var ft = [];
    if (this.flags & 8) vt.push("uniform mat4 tmWorld;uniform mat4 tmModelView;uniform mat4 tmPrj;");
    if (this.flags & IV.R_Z_OFFSET) vt.push("uniform float zOffset;");
    var bN = (this.flags & 1) != 0,
        bSpecular = false,
        bDiffuse = false,
        bLights = false,
        bReflection = false,
        bBump = false;
    var bEmissive = mtl.isChannel(mtl.emissive);
    var bOpacity = mtl.isChannel(mtl.opacity);
    var lights = mtl.space.lights;
    vt.push("attribute vec3 inV;\nvarying vec4 wPosition;");
    if (this.flags & 4) vt.push("varying vec3 vC;attribute vec3 inC;");
    var bUV = false;
    if (bN) {
        vt.push("varying vec3 wNormal;attribute vec3 inN;");
        if (lights.length) {
            if (mtl.isChannel(mtl.diffuse)) bDiffuse = true;
            if (mtl.isChannel(mtl.specular)) bSpecular = true;
            bLights = bDiffuse || bSpecular;
        }
        if (mtl.space.cfgTextures) bReflection = this.c0(mtl.reflection);
    }
    if (this.flags & 2) {
        if (bDiffuse) bUV |= this.c0(mtl.diffuse);
        if (bSpecular) bUV |= this.c0(mtl.specular);
        if (bEmissive) bUV |= this.c0(mtl.emissive);
        if (bOpacity) bUV |= this.c0(mtl.opacity);
        if (bN && bLights) bUV |= (bBump = this.c0(mtl.bump));
    }
    if (bUV) vt.push("varying vec2 vUV;attribute vec2 inUV;");
    if (bBump) {
        vt.push("varying vec3 vBN,vBT;attribute vec3 inBN,inBT;");
    }
    this.loadedtextures = this.readyTextures(true);
    vt.push("\r\nvoid main(void){\r\n");
    if (this.flags & 8) {
        vt.push("wPosition=tmWorld*vec4(inV,1.0);vec4 vPosition=tmModelView* wPosition;gl_Position=tmPrj* vPosition;");
        this.addVar("tmWorld", 4101);
        this.addVar("tmModelView", 4114);
        this.addVar("tmPrj", 4115);
    } else vt.push("gl_Position=vec4(inV,1.0);");
    if (this.flags & IV.R_Z_OFFSET) {
        this.addVar("zOffset", 4105);
        vt.push("gl_Position.z+=zOffset;");
    }
    if (bN) {
        vt.push("\r\n wNormal=");
        if (mtl.backSide) vt.push("-");
        vt.push("normalize(vec3(tmWorld* vec4(inN,0.0)));");
    }
    if (bBump) vt.push("\r\n vBN=normalize(vec3(tmWorld* vec4(inBN,0.0)));vBT=normalize(vec3(tmWorld* vec4(inBT,0.0)));");
    if (bUV) vt.push("vUV=inUV;");
    if (this.flags & 4) vt.push("vC=inC;");
    vt.push("}");
    ft.push("precision mediump float;");
    if (bN) ft.push("varying vec4 wPosition;");
    if (this.flags & 4) ft.push("varying vec3 vC;");
    if (bUV) ft.push("varying vec2 vUV;");
    if (bBump) ft.push("varying vec3 vBN,vBT;");
    if (bDiffuse) this.preChannel(mtl.diffuse, ft);
    if (bSpecular) this.preChannel(mtl.specular, ft);
    if (bEmissive) this.preChannel(mtl.emissive, ft);
    if (bReflection) this.preChannel(mtl.reflection, ft);
    if (bOpacity) this.preChannel(mtl.opacity, ft);
    if (bBump) this.preChannel(mtl.bump, ft);
    for (i = 0; i < this.textures.length; i++) {
        var t = this.textures[i];
        if (t.txt.ivready) {
            ft.push("uniform ");
            if (t.txt.ivtype == gl.TEXTURE_CUBE_MAP) ft.push("samplerCube");
            else
                ft.push("sampler2D");
            ft.push(" txtUnit" + t.slot + ";");
            if (t.tm) {
                var v = this.addVar("tm", 4103);
                v.channel = t.ch;
                ft.push("uniform mat3 ch" + t.ch._id + "tm;");
            }
        }
    }
    if (bN) {
        ft.push("uniform vec3 eye;");
        this.addVar("eye", 4113);
        if (bSpecular) {
            ft.push("uniform float mtlPhong;");
            this.addVar("mtlPhong", 4116);
        }
        ft.push("varying vec3 wNormal;");
        ft.push("float k;");
        if (bLights) {
            ft.push("vec3 diffuse,specular,lightDir;");
            _lights = [];
            for (i = 0; i < lights.length; i++) {
                var ls = lights[i];
                var l = {};
                l.light = ls;
                var colorname = "light" + i + "Clr";
                ft.push("\r\n uniform vec3 " + colorname + ";");
                l.colorname = colorname;
                this.addLightVar("lightColor", colorname, ls, 4110);
                if (ls.dir) {
                    var dirname = "light" + i + "Dir";
                    l.dirname = dirname;
                    ft.push("uniform vec3 " + dirname + ";");
                    this.addLightVar("lightDir", dirname, ls, 4112);
                }
                if (ls.org) {
                    var orgname = "light" + i + "Org";
                    l.orgname = orgname;
                    ft.push("uniform vec3 " + orgname + ";");
                    this.addLightVar("lightOrg", orgname, ls, 4111);
                }
                _lights.push(l);
            }
        }
    }
    ft.push("\nvoid main(void){\r\n");
    this.fetchTextures(gl, ft);
    if (bN) {
        ft.push("vec3 normal=normalize(wNormal);");
        if (bBump) {
            var txt = this.handleBumpChannel(gl, mtl.bump);
            if (txt) {
                ft.push(txt);
                ft.push("mat3 tsM=mat3(normalize(vBN),normalize(vBT),normal);");
                ft.push("normal=normalize(tsM*_n);");
            }
        }
        if (mtl.space.cfgDbl) ft.push("if(!gl_FrontFacing)normal=-normal;");
        ft.push("vec3 eyeDirection=normalize(wPosition.xyz-eye);vec3 reflDir;");
        if (_lights)
            for (i = 0; i < _lights.length; i++) {
                var l = _lights[i];
                var dirName;
                if (l.orgname) {
                    ft.push("lightDir=normalize(wPosition.xyz-" + l.orgname + ");");
                    dirName = "lightDir";
                } else dirName = l.dirname;
                if (bSpecular) {
                    ft.push("\nreflDir=reflect(-" + dirName + ",normal);");
                    ft.push("k=pow(max(dot(reflDir,eyeDirection),0.0),mtlPhong);");
                    if (i) ft.push("specular+=");
                    else ft.push("specular=");
                    ft.push("k*" + l.colorname + ";");
                }
                if (bDiffuse) {
                    ft.push("k=max(dot(normal,-" + dirName + "),0.0);");
                    if (i) ft.push("diffuse+=");
                    else ft.push("diffuse=");
                    ft.push("k*" + l.colorname + ";");
                }
            }
    }
    ft.push("vec3 color=vec3(0.0,0.0,0.0);\r\n");
    if (bReflection) this.handleChannel(gl, mtl.reflection, null, ft);
    if (this.flags & 4) {
        ft.push(bDiffuse ? "diffuse=diffuse*vC;" : "color+=vC;");
    }
    if (bDiffuse) this.handleChannel(gl, mtl.diffuse, "diffuse", ft);
    if (bSpecular) this.handleChannel(gl, mtl.specular, "specular", ft);
    if (bEmissive) this.handleChannel(gl, mtl.emissive, null, ft);
    if (bOpacity) {
        var n = this.handleAlphaChannel(gl, mtl.opacity, ft);
        ft.push("gl_FragColor=vec4(color," + n + ");");
    } else
        ft.push("gl_FragColor=vec4(color,1);");
    ft.push("}");
    this.vShader = this.compile(gl, vt, gl.VERTEX_SHADER);
    this.fShader = this.compile(gl, ft, gl.FRAGMENT_SHADER);
    var shPrg = gl.createProgram();
    this.program = shPrg;
    gl.attachShader(shPrg, this.vShader);
    gl.attachShader(shPrg, this.fShader);
    gl.linkProgram(shPrg);
    if (!gl.getProgramParameter(shPrg, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shPrg);
    this.addAttr(4300, "inV", gl);
    if (bN) this.addAttr(4301, "inN", gl);
    if (bUV) this.addAttr(4302, "inUV", gl);
    if (bBump) {
        this.addAttr(4303, "inBN", gl);
        this.addAttr(4304, "inBT", gl);
    }
    if (this.flags & 4) this.addAttr(4305, "inC", gl);
    for (i = 0; i < this.textures.length; i++) {
        var t = this.textures[i];
        if (t.txt.ivready) {
            t.uniform = gl.getUniformLocation(shPrg, "txtUnit" + t.slot);
        }
    }
    for (i = 0; i < this.vars.length; i++) {
        var v = this.vars[i];
        var name = null;
        switch (v.id) {
            case "tm":
                name = "ch" + v.channel._id + "tm";
                break;
            case "color":
                name = "ch" + v.channel._id + "clr";
                break;
            case "amount":
                name = "ch" + v.channel._id + "amount";
                break;
            case "lightColor":
            case "lightDir":
            case "lightOrg":
                name = v.name;
                break;
            default:
                name = v.id;
        }
        v.slot = gl.getUniformLocation(shPrg, name);
        if (!v.slot) console.log("Slot '" + name + "' not found");
    }
    this.bValid = true;
    return true;
}
shader3d.prototype.detach = function(gl) {
    if (this.program !== null) {
        gl.detachShader(this.program, this.vShader);
        gl.detachShader(this.program, this.fShader);
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vShader);
        gl.deleteShader(this.fShader);
        this.program = null;
        this.fShader = null;
        this.vShader = null;
    }
    this.attrs = [];
    this.vars = [];
    this.textures = [];
    this.loadedtextures = 0;
}
shader3d.prototype.activate = function(space, mtl, tm, flags, newObj) {
    mtl = this.mtl;
    var gl = mtl.gl,
        i;
    if (!newObj) {
        gl.useProgram(this.program);
        for (i = 0; i < this.textures.length; i++) {
            var t = this.textures[i];
            if (t.txt.ivready) {
                gl.activeTexture(gl.TEXTURE0 + t.slot);
                var type = t.txt.ivtype;
                gl.bindTexture(type, t.txt);
                if (type == gl.TEXTURE_2D && space.e_ans && (t.txt.filter == IV.FILTER_MIPMAP)) gl.texParameterf(type, space.e_ans.TEXTURE_MAX_ANISOTROPY_EXT, space.e_ansMax);
                gl.texParameteri(type, gl.TEXTURE_WRAP_S, t.wrapS);
                gl.texParameteri(type, gl.TEXTURE_WRAP_T, t.wrapT);
                gl.uniform1i(t.uniform, t.slot);
            }
        }
    }
    var _i = this.vars;
    for (i = 0; i < _i.length; i++) {
        var a = _i[i],
            s = a.slot;
        switch (a.ord) {
            case 4101:
                gl.uniformMatrix4fv(s, false, tm);
                break;
            case 4102:
                {
                    var c = c = a.channel.color;
                    if (flags & 256) c = vec3.lerp_r(c, space.clrSelection, 0.5);
                    gl.uniform3fv(s, c);
                }
                break;
            case 4103:
                gl.uniformMatrix3fv(s, false, a.channel.tm);
                break;
            case 4104:
                gl.uniform1f(s, a.channel.amount);
                break;
            case 4105:
                gl.uniform1f(s, 0);
                break;
            default:
                if (!newObj) {
                    switch (a.ord) {
                        case 4110:
                            gl.uniform3fv(s, a.light.color);
                            break;
                        case 4111:
                            gl.uniform3fv(s, a.light.org);
                            break;
                        case 4112:
                            gl.uniform3fv(s, a.light.dir);
                            break;
                        case 4113:
                            gl.uniform3fv(s, space.window.viewFrom);
                            break;
                        case 4114:
                            gl.uniformMatrix4fv(s, false, space.modelviewTM);
                            break;
                        case 4115:
                            gl.uniformMatrix4fv(s, false, space.projectionTM);
                            break;
                        case 4116:
                            gl.uniform1f(s, mtl.phong);
                            break;
                    }
                }
        }
    }
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
    if (d.mtl != undefined) {
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

function mesh3d(gl) {
    this.gl = gl;
    this.lineMode = false;
    this.meshSheet = null;
    this.ref = 0;
}

mesh3d.prototype.setBuffer = function(n, b) {
    n += 'Buffer';
    var _b = this[n];
    if (_b) {
        _b.ref--;
        if (_b.ref < 1) this.gl.deleteBufffer - fer(_b);
    }
    this[n] = b;
    if (b) {
        if (b.ref) b.ref++;
        else b.ref = 1;
    }
};

mesh3d.prototype.addRef = function() {
    this.ref++;
}
mesh3d.prototype.release = function() {
    this.ref--;
    if (this.ref < 1) this.clear();
}

function addEdge(e, v1, v2) {
    if (v2 > v1) {
        var _v = v2;
        v2 = v1;
        v1 = _v;
    }
    if (e[v1] == undefined) e[v1] = v2;
    else
    if (typeof e[v1] === 'number') e[v1] = [e[v1], v2];
    else e[v1].push(v2);
};
mesh3d.prototype.updateEdges = function() {
    if (!this.edgeBuffer) {
        var e = [];
        var f = this.faces;
        var nf = f.length / 3;
        var j = 0;
        var i;
        for (i = 0; i < nf; i++) {
            addEdge(e, f[j], f[j + 1]);
            addEdge(e, f[j + 1], f[j + 2]);
            addEdge(e, f[j + 2], f[j]);
            j += 3;
        }
        var ne = e.length;
        var num = 0;
        for (i = 0; i < ne; i++) {
            var v = e[i];
            if (v != undefined) {
                if (typeof v === 'number') num++;
                else num += v.length;
            }
        }
        var edges = new Uint16Array(num * 2);
        var j = 0;
        for (i = 0; i < ne; i++) {
            var v = e[i];
            if (v != undefined) {
                if (typeof v === 'number') {
                    edges[j] = i;
                    edges[j + 1] = v;
                    j += 2;
                } else {
                    for (var i1 = 0; i1 < v.length; i1++) {
                        edges[j] = i;
                        edges[j + 1] = v[i1];
                        j += 2;
                    }
                }
            }
        }
        this.setBuffer('e', ivBufferI(this.gl, edges));
    }
}
mesh3d.prototype.c1 = function(space, info, oz) {
    var s = space.c2(info.mtl, info.tm, oz);
    var gl = space.gl;
    var _i = s.attrs,
        c = _i.length;
    for (var i = 0; i < c; i++) {
        var v = _i[i];
        var b = null,
            f = gl.FLOAT,
            n = false;
        switch (v.id) {
            case 4300:
                b = this.vBuffer;
                break;
            case 4301:
                b = this.nBuffer;
                break;
            case 4302:
                b = this.uvBuffer;
                break;
            case 4303:
                b = this.bnBuffer;
                break;
            case 4304:
                b = this.btBuffer;
                break;
            case 4305:
                b = this.cBuffer;
                f = gl.UNSIGNED_BYTE;
                n = true;
                break;
        }
        if (b) {
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.vertexAttribPointer(v.slot, b.itemSize, f, n, 0, 0);
        }
    }
}
mesh3d.prototype.render = function(space, info) {
    var fb = this.fBuffer;
    if (fb && this.vBuffer) {
        var state = info.state;
        var gl = space.gl;
        if (state & IV.R_Z_NOWRITE) gl.depthMask(false);
        var oz = 8;
        var rmode = space.rmodes[(state & 0xff00) >> 8];
        var bEdges = rmode.e;
        if (bEdges) this.updateEdges(gl);
        else {
            if (this.nBuffer) oz |= 1;
            if (this.uvBuffer) oz |= 2;
            if (this.cBuffer) oz |= 4;
            if (this.bnBuffer) oz |= 16;
            if (state & IV.R_SELECTION) oz |= 256;
        }
        oz |= (state & (IV.R_Z_OFFSET));
        this.c1(space, info, oz);
        if (bEdges) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eBuffer);
            gl.drawElements(gl.LINES, this.eBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fb);
            var o = fb.offset;
            gl.drawElements(this.lineMode ? gl.LINES : gl.TRIANGLES, fb.numItems, gl.UNSIGNED_SHORT, o ? o : 0);
        }
        if (state & IV.R_Z_NOWRITE) gl.depthMask(true);
    }
}

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
mesh3d.prototype.clear = function() {
    this.setBuffer('uv', null);
    this.setBuffer('f', null);
    this.setBuffer('v', null);
    this.setBuffer('n', null);
    this.setBuffer('e', null);
    this.setBuffer('c', null);
    this.setBuffer('bn', null);
    this.setBuffer('bt', null);
};

function loadMeshSheet(oi) {
    oi.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data = JSON.parse(this.responseText);
            if(data.constructor !== Array)
                data = [data];
            for(var i in this.meshSheet.objects) {
                ivobject = this.meshSheet.objects[i];
                ivobject.oj(this.ivspace, data[i]);
                this.ivspace.onMeshLoaded(ivobject);
            }
            this.ivspace.meshSheets.remove(this.meshSheet);

            this.ivspace.meshSheetsInQueue--;
            if (!this.ivspace.meshSheetsInQueue) {
                var w = this.window;
                if (w && w.onMeshesReady) w.onMeshesReady(w, this);
            }
        }
    }
    oi.onerror = function() {
        /*If there is an error, we'll try again later.*/
        this.meshSheet.request = null;
        this.meshSheet.objects[0].meshSheet = this.meshSheet; /*Set it back on at least 1 object!*/
        this.ivspace.meshSheetsInQueue--;
    }
}
mesh3d.prototype.oj = function(space, data) {
    var gl = space.gl;
    if (data.vertexNormals) {
        var n = new Float32Array(data.vertexNormals);
        this.setBuffer('n', ivBufferF(gl, n, 3));
    } {
        var count = data.vertexPositions.length / 3;
        var va = data.vertexPositions;
        var v = new Float32Array(va);
        this.setBuffer('v', ivBufferF(gl, v, 3));
        var vminx = va[0],
            vminy = va[1],
            vminz = va[2];
        var vmaxx = vminx,
            vmaxy = vminy,
            vmaxz = vminz;
        for (var i = 1; i < count; i++) {
            var j = i * 3;
            var p = va[j];
            if (p < vminx) vminx = p;
            else if (p > vmaxx) vmaxx = p;
            p = va[j + 1];
            if (p < vminy) vminy = p;
            else if (p > vmaxy) vmaxy = p;
            p = va[j + 2];
            if (p < vminz) vminz = p;
            else if (p > vmaxz) vmaxz = p;
        }
        this.boxMin = [vminx, vminy, vminz];
        this.boxMax = [vmaxx, vmaxy, vmaxz];
    }
    var faces;
    if (data.indices) faces = data.indices;
    else
    if (data.lines) {
        faces = data.lines;
        this.lineMode = true;
    }
    if (faces) {
        var f = new Uint16Array(faces);
        this.setBuffer('f', ivBufferI(gl, f));
    }
    if (space.cfgKeepMeshData & 1) this.faces = f;
    if (space.cfgKeepMeshData & 2) this.points = v;
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
ivwindow3d.prototype.getMaterials = function() {
    return this.space.cfgDefMtl == null;
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