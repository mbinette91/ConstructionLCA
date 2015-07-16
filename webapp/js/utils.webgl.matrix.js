/*
* Contains utils classes for WebGL (vec3, mat3 and mat4)
*/

WebGL = {}
WebGL.MatrixArrayType = typeof Float32Array != "undefined" ? Float32Array : typeof WebGLFloatArray != "undefined" ? WebGLFloatArray : Array;

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
var vec3 = {};
vec3.create = function(a) {
    var b = new WebGL.MatrixArrayType(3);
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

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};
mat3.create = function(a) {
    var b = new WebGL.MatrixArrayType(9);
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

/**
 * @class 4x4 Matrix
 * @name mat4
 */
var mat4 = {};
mat4.create = function(a) {
    var b = new WebGL.MatrixArrayType(16);
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
mat4.offset = function(tm, offset) {
    tm[12] += offset[0];
    tm[13] += offset[1];
    tm[14] += offset[2];
};
mat4.copy = function(src, dst) {
    for (var i = 0; i < 16; i++) dst[i] = src[i];
};
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
};
mat4.setRow = function(tm, index, p) {
    index *= 4;
    tm[index] = p[0];
    tm[index + 1] = p[1];
    tm[index + 2] = p[2];
};
mat4.invert = function(out, a) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11],
        a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15],
        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
        return null;
    }
    det = 1.0 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
};