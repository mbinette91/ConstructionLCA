/*
* Author: Mathieu Binette
* Features:
*   - Handles element selection and selected element information.
*/

PreviewModule.prototype.refreshSelectedObjectsInfo = function(f) {
    var get_info = function (data){
        var info = {};
        info["name"] = data.name;
        info["guid"] = data.guid;
        info["type"] = data.className;
        info["description"] = data.description;
        var mat = data.material;
        if(mat && mat.name){
            info["material"] = mat.name + " (" + mat.thickness + ") - " + mat.layerName;
        }
        else{
            info["material"] = "None";
        }
        return info;
    }

    var has_common_info = false;
    var write_info = function(info, i) {
        var local_has_common_info =  i == 0;
        for(var info_name in info) {
            var elem = $("#selected-element-info ." + info_name + " .info");
            if(i == 0)
                elem.html(info[info_name]);
            else if(elem.html() == info[info_name]) {
                if(info[info_name]) // If it's empty, there's nothing much to show...
                    local_has_common_info = true;
                elem.html(info[info_name]);
            }
            else 
                elem.html("[various]");
        }
        has_common_info = has_common_info && local_has_common_info;
    }

    var clear_info = function() {
        has_common_info = true;
    }

    clear_info();

    for(var i in this.scene.selectedObjects) {
        var node = this.scene.selectedObjects[i];
        if(node && node.data)
            write_info(get_info(node.data), i)
    }

    if(this.scene.selectedObjects.length == 0 || !has_common_info)
        $("#selected-element-info").hide();
    else
        $("#selected-element-info").show();

    var show = false;
    var $info = $("#selected-element-properties");
    if(this.scene.selectedObjects.length == 1) {
        // Only load this if a single element is selected
        var node = this.scene.selectedObjects[0];
        if(node.data && !node.data.properties_loaded) {
            var that = this;
            var product_id = node.data.guid;

            $.ajax("/project/info?get=properties&id="+this.gui.projectId+"&product_id="+product_id, {
                error: function(){
                    console.log("Error while loading product (id=" + product_id + ") properties!");
                },
                success: function(data){
                    node.data.property_sets = JSON.parse(data);
                    node.data.properties_loaded = true;
                    that.refreshSelectedObjectsInfo();
                }
            })
        }

        $info.html("");
        for(var i in node.data.property_sets) {
            show = true;
            var ps = node.data.property_sets[i];
            var html = '<div class="element-info-property-set"><strong>'+ps.name+': </strong>';
            for(var j in ps.properties) {
                var prop = ps.properties[j];
                html += ('<div class="element-info-property">'+prop.name + ": " + prop.value+'</div>');
            }
            html += ('</div>');
            $info.append(html);
        }
    }
    if(!show)
        $info.hide();
    else
        $info.show();
}

Object3D.prototype.Select = function(select) {
    var b = this.setState(select? 4 : 0, 4);
    return b;
}

Object3D.prototype.isSelected = function() {
    return this.state & 4;
}

Scene.prototype.Select = function(object, select, multiple) {
    if(!multiple)
        this.clearSelected();

    if (object.Select(select)) {
        if(object.isSelected())
            this.selectedObjects.push(object);
        else{
            for(var i in this.selectedObjects) {
                if(this.selectedObjects[i] == object) {
                    this.selectedObjects.splice(i, 1);
                }
            }
        }
        this.invalidate();
    }

    return false;
}

Scene.prototype.clearSelected = function() {
    this.selectedObjects = []
    for(var i in this.objects3d)
        this.objects3d[i].setState(0, 4);
}

Scene.prototype.selectObject = function(guid, multiple) {
    var node = this.objects3d[guid];

    if (node) {
        var bSelect = true;
        if (multiple && node && node.isSelected()) bSelect = false;
        this.Select(node, bSelect, multiple);
    }
}

/*
* Everything below this comment was taken from various sources from the WWW.
* Sources: Various functions from the WWW.
*/
PreviewModule.prototype.getRay = function(x, y, ray) {
    var gl = this.gl,
        w = gl.viewportWidth,
        h = gl.viewportHeight;
    gl.viewport(0, 0, w, h);
    var p1 = this.scene.view.from,
        p2 = this.scene.view.to;
    var dir = vec3.sub_r(this.scene.view.to, this.scene.view.from);
    var dirLen = vec3.length(dir);
    var up = this.scene.view.getUpVector();
    var k = Math.tan(Math.PI * this.scene.view.fov / 360);
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

/*Hit test stuff*/
function BOXTRITEST(_min, _max, org, dir, tn, tf, c, x) {
    var _min_x = _min[x];
    var org_x = org[x];
    var dx = dir[x];
    if (dx) {
        var t1 = (_min_x - org_x) / dx;
        var t2 = (_max[x] - org_x) / dx;
        if (t1 < t2) {
            tn[c] = t1;
            tf[c] = t2;
        } else {
            tn[c] = t2;
            tf[c] = t1;
        }
    } else {
        if ((org_x < _min_x) || (org_x > _max[x])) return false;
    }
    return true;
};

function HitBBox(_min, _max, org, dir) {
    var tf = [0, 0, 0];
    var tn = [0, 0, 0];
    var c = 0;
    if (BOXTRITEST(_min, _max, org, dir, tn, tf, c, 0)) c++;
    else return null;
    if (BOXTRITEST(_min, _max, org, dir, tn, tf, c, 1)) c++;
    else return null;
    if (BOXTRITEST(_min, _max, org, dir, tn, tf, c, 2)) c++;
    else return null;
    var maxnear = tn[0];
    var minfar = tf[0];
    for (var i = 1; i < c; i++) {
        if (tn[i] > maxnear) maxnear = tn[i];
        if (tf[i] < minfar) minfar = tf[i];
    }
    if (maxnear > minfar) return null;
    var hp = vec3.scale_r(dir, maxnear);
    vec3.add_ip(hp, org);
    return hp;
}

function hitTriangle(loc, side1, side2, org, dir, info) {
    var vd, t, u, v;
    var s1_0 = side1[0] - loc[0],
        s1_1 = side1[1] - loc[1],
        s1_2 = side1[2] - loc[2];
    var s2_0 = side2[0] - loc[0],
        s2_1 = side2[1] - loc[1],
        s2_2 = side2[2] - loc[2];
    var dirX = dir[0],
        dirY = dir[1],
        dirZ = dir[2];
    var orgX = org[0],
        orgY = org[1],
        orgZ = org[2];
    var nX = s1_1 * s2_2 - s1_2 * s2_1,
        nY = s1_2 * s2_0 - s1_0 * s2_2,
        nZ = s1_0 * s2_1 - s1_1 * s2_0;
    var d = Math.sqrt(nX * nX + nY * nY + nZ * nZ);
    if (!d) return false;
    nX /= d;
    nY /= d;
    nZ /= d;
    vd = nX * dirX + nY * dirY + nZ * dirZ;
    if (1) {
        if (vd == 0.0) return false;
    } else {
        if (vd >= 0.0) return false;
    }
    t = ((loc[0] - orgX) * nX + (loc[1] - orgY) * nY + (loc[2] - orgZ) * nZ) / vd;
    if (t < 1e-6) return false;
    var s11 = s1_0 * s1_0 + s1_1 * s1_1 + s1_2 * s1_2;
    var s12 = s1_0 * s2_0 + s1_1 * s2_1 + s1_2 * s2_2;
    var s22 = s2_0 * s2_0 + s2_1 * s2_1 + s2_2 * s2_2;
    d = s11 * s22 - s12 * s12;
    if (d <= 1e-34) return false;
    var kuX = (s1_0 * s22 - s2_0 * s12) / d,
        kuY = (s1_1 * s22 - s2_1 * s12) / d,
        kuZ = (s1_2 * s22 - s2_2 * s12) / d;
    var u0 = -(loc[0] * kuX + loc[1] * kuY + loc[2] * kuZ);
    var pX = dirX * t + orgX,
        pY = dirY * t + orgY,
        pZ = dirZ * t + orgZ;
    u = u0 + pX * kuX + pY * kuY + pZ * kuZ;
    if ((u <= 0.0) || (u >= 1.0)) return false;
    var kvX = (s2_0 * s11 - s1_0 * s12) / d,
        kvY = (s2_1 * s11 - s1_1 * s12) / d,
        kvZ = (s2_2 * s11 - s1_2 * s12) / d;
    var v0 = -(loc[0] * kvX + loc[1] * kvY + loc[2] * kvZ);
    v = v0 + pX * kvX + pY * kvY + pZ * kvZ;
    if (!((v > 0.0) && (u + v < 1.0))) return false;
    if (t < info.lLength) {
        info.lHit = [pX, pY, pZ];
        info.lLength = t;
        return true;
    }
    return false;
}

function HitTestNode(node, tm, info) {
    if (node.state & 64) return 0;
    return node.hitTest(tm, info);
}
Object3D.prototype.hitTest = function(tm, info) {
    function GetRayPoint(ray, i) {
        if (i) i = 3;
        return [ray[i], ray[i + 1], ray[i + 2]];
    }
    if (this.object) {
        var obj = this.object;
        if (obj.boxMin && obj.boxMax) {
            var itm = mat4.invert(info.itm, tm);
            var org = mat4.mulPoint(itm, GetRayPoint(info.ray, 0));
            var dir = mat4.mulPoint(itm, GetRayPoint(info.ray, 1));
            vec3.sub_ip(dir, org);
            vec3.normalize(dir);
            var hit = HitBBox(obj.boxMin, obj.boxMax, org, dir);
            if (hit) {
                if (info.node) {
                    vec3.sub_ip(mat4.mulPoint(tm, hit), info.ray);
                    var l = vec3.length(hit);
                    if (l > info.length) return 1;
                }
                if (obj.faces && obj.points) {
                    {
                        var f = obj.faces;
                        var p = obj.points;
                        var index = 0;
                        info.lLength = 1e34;
                        var bOk = false;
                        if (obj.lineMode) {
                            var j = 0;
                        } else {
                            var nt = f.length / 3;
                            var v0 = [0, 0, 0],
                                v1 = [0, 0, 0],
                                v2 = [0, 0, 0];
                            for (var i = 0; i < nt; i++) {
                                var vi = f[index++] * 3;
                                v0[0] = p[vi];
                                v0[1] = p[vi + 1];
                                v0[2] = p[vi + 2];
                                vi = f[index++] * 3;
                                v1[0] = p[vi];
                                v1[1] = p[vi + 1];
                                v1[2] = p[vi + 2];
                                vi = f[index++] * 3;
                                v2[0] = p[vi];
                                v2[1] = p[vi + 1];
                                v2[2] = p[vi + 2];
                                bOk |= hitTriangle(v0, v1, v2, org, dir, info);
                            }
                        }
                        if (bOk) {
                            mat4.mulPoint(tm, info.lHit);
                            var hp = info.lHit.slice();
                            vec3.sub_ip(info.lHit, info.ray);
                            var l = vec3.length(info.lHit);
                            if (l < info.length) {
                                info.length = l;
                                info.node = this;
                                info.pnt = hp;
                            }
                        }
                    }
                }
            }
        }
    }
    return 1;
}

function hitInfo_getWindow() {
    return this.scene.window;
}
PreviewModule.prototype.hitTest = function(ray) {
    if (this.scene.loaded) {
        var hitInfo = {
            "scene": this.scene,
            "ray": ray,
            "length": 1e34,
            "getWindow": hitInfo_getWindow
        };
        var tm = mat4.create();
        mat4.identity(tm);
        hitInfo.itm = mat4.create();

        for(var i in this.scene.objects3d)
            HitTestNode(this.scene.objects3d[i], tm,  hitInfo)

        if (hitInfo.node) {
            var n = hitInfo.node;
            while (n) {
                if (n.state & 8) hitInfo.node = n;
                n = n.parent;
            }
            hitInfo.scene = null;
            hitInfo.ray = null;
            return hitInfo;
        }
    }
    return null;
}