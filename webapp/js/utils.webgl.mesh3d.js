
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
    space.setActiveShader(info.mtl, info.mtl.shader, info.tm, oz);
    var s = info.mtl.shader;
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

mesh3d.prototype.initialize = function(space, data) {
    var gl = space.gl;
    if (data.vertexNormals) {
        var n = new Float32Array(data.vertexNormals);
        this.setBuffer('n', ivBufferF(gl, n, 3));
    }
    else {
        var n = this.computeVertexNormals(space, data);
        this.setBuffer('n', ivBufferF(gl, n, 3));
    }
    {
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
    
    this.faces = f;
    this.points = v;
};

// Author: Mathieu Binette
mesh3d.prototype.computeVertexNormals = function(space, data){
    var indicesCount = data.indices.length;
    var n = new Float32Array(indicesCount * 3); // Initialized to 0
    var normals_list = new Array(indicesCount);;
    var getVertex = function(i, vertexPositions){
        return [ vertexPositions[i*3], vertexPositions[i*3 + 1], vertexPositions[i*3 + 2] ]
    }

    // Compute face normals
    for(var i = 0; i < indicesCount; i += 3) {
        var p1 = getVertex(data.indices[i], data.vertexPositions)
        var p2 = getVertex(data.indices[i+1], data.vertexPositions)
        var p3 = getVertex(data.indices[i+2], data.vertexPositions)

        var v1 = vec3.subtract(p2, p1);
        var v2 = vec3.subtract(p3, p1);
        var face_normal = vec3.cross(v1, v2);

        vec3.normalize(face_normal);

        normals_list[data.indices[i]] = [face_normal];
        normals_list[data.indices[i+1]] = [face_normal];
        normals_list[data.indices[i+2]] = [face_normal];
    }

    // Now compute vertex vectors by averaging all face normals stored
    for(var i = 0; i < indicesCount; i++) {
        var normal = new Float32Array(3);
        for(var j = 0; j < normals_list[i].length; j++)
            normal = vec3.add(normal, normals_list[i][j]);

        normal = vec3.scale(normal, 1/normals_list[i].length);
        n[i*3] = normal[0];
        n[i*3+1] = normal[1];
        n[i*3+2] = normal[2];
    }

    return n;
}