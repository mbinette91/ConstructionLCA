
PreviewModule.prototype.initHandlers = function() {
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
        }
    };
    this.input = i;
}
PreviewModule.prototype.initEvents = function() {
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
PreviewModule.prototype.releaseCapture = function() {
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
PreviewModule.prototype.setCapture = function() {
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
PreviewModule.prototype.delEvent = function(d, e, f) {
    if (d.detachEvent) d.detachEvent("on" + e, f);
    else if (d.removeEventListener) d.removeEventListener(e, f);
}
PreviewModule.prototype.setEvent = function(d, e, f) {
    if (d.attachEvent) d.attachEvent("on" + e, f);
    else if (d.addEventListener) d.addEventListener(e, f);
}

PreviewModule.prototype.handleObjSelect = function(x, y, event, bDown) {
    if (!bDown) {
        this.mouseMoved = false;
        var ray = this.getRay(x, y);
        var h = this.hitTest(ray);
        var n = h ? h.node : null;
        var bCtrl = (event.ctrlKey == 1);
        var bSelect = true;
        if (bCtrl && n && n.state & 4) bSelect = false;
        this.scene.Select(n, bSelect, bCtrl);
        this.gui.tree.setSelectedObjects(this.scene.selectedObjects);
    }
}
PreviewModule.prototype.onMouseUp = function(event, touch) {
    var e = event;
    if (touch) {
        if (event.touches.length) e = event.touches[0];
        else e = null;
    }
    var p = this.getClientPoint(e, touch);
    var flags = 3;
    if (this.handler) {
        flags = this.handler.onMouseUp(p, event);
        if (flags & 4) this.handler = 0;
    }
    if ((!this.mouseMoved) && (flags & 1)) this.handleObjSelect(this.LX, this.LY, event, false);
    this.releaseCapture();
};
PreviewModule.prototype.getTouchDistance = function(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX,
        dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
PreviewModule.prototype.getClientPoint = function(e, touch) {
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
PreviewModule.prototype.decodeButtons = function(e, bt) {
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
PreviewModule.prototype.pd = function(e) {
    if (e && e.preventDefault) e.preventDefault();
}
PreviewModule.prototype._onContextMenu = function(event) {
    this.pd(event);
    if (this.mouseCancelPopup) {
        this.mouseCancelPopup = false;
        return false;
    }
    if (this.onContextMenu) this.onContextMenu(event);
    return true;
}
PreviewModule.prototype._onDblClick = function(event) {
    if (this.onDblClick) this.onDblClick(event, false);
    this.pd(event);
    event.stopPropagation();
    return true;
}
PreviewModule.prototype.onTouchMove = function(event) {
    this.onMouseMove(event, true);
    this.pd(event);
    return false;
}
PreviewModule.prototype.onTouchCancel = function(event) {
    this.onMouseUp(event, true);
    if (event.cancelable) this.pd(event);
}
PreviewModule.prototype._onMouseMove = function(event) {
    if (this.mouseCaptured) {
        this.mouseMoved = true;
        var b = this.decodeButtons(event, false);
        if (b) this.onMouseMove(event, false);
        else this.onMouseUp(event, false);
        this.pd(event);
        event.stopPropagation();
        this.mouseMoved = false;
        return true;
    } else {
        this.mouseMoved = true;
        if (this.onMouseHover) this.onMouseHover(event);
        this.mouseMoved = false;
    }
    return false;
}
PreviewModule.prototype.onMouseDown = function(event, touch) {
    this.setCapture();

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
PreviewModule.prototype.onMouseMove = function(event, touch) {
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
PreviewModule.prototype.onMouseWheel = function(event) {
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
PreviewModule.prototype.doPan = function(dX, dY) {
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
PreviewModule.prototype.doOrbit = function(dX, dY) {
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
PreviewModule.prototype.doDolly = function(dX, dY) {
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
PreviewModule.prototype.doFOV = function(dX, dY) {
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