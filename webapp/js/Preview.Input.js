PreviewModule.InputHandler = function(preview) {
    this.preview = preview;

    this.orbitMode = 1;
    this.cameraMode = 0;
    this.LX = 0;
    this.LY = 0;

    this.mouseCaptured = false;
    this.mouseMoving = false;
}

PreviewModule.InputHandler.prototype.initialize = function() {
    var that = this;
    this.input = {
        "mousemove": function(event) {
            return that.onMouseMove(event);
        },
        "mousedown": function(event) {
            return that.onMouseDown(event);
        },
        "mouseup": function(event) {
            return that.onMouseUp(event);
        },
        "dblclick": function(event) {
            return that.onDoubleClick(event);
        },
        "contextmenu": function(event) {
            that.preventDefault(event); // Kill the normal context menu.
        },
        "mousewheel": function(event) {
            return that.onMouseWheel(event);
        }
    };

    if(/Firefox/i.test(navigator.userAgent)) {
        // https://developer.mozilla.org/en-US/docs/Web/Events/DOMMouseScroll
        this.input["DOMMouseScroll"] = this.input["mousewheel"];
        delete this.input["mousewheel"];
    }

    // Add the event listeners defined above.
    for(var event_name in this.input)
        this.addEvent(this.preview.canvas, event_name, this.input[event_name]);
}
PreviewModule.InputHandler.prototype.addEvent = function(canvas, event_name, funct) {
    if (canvas.attachEvent) 
        canvas.attachEvent("on" + event_name, funct);
    else if (canvas.addEventListener) 
        canvas.addEventListener(event_name, funct);
}

PreviewModule.InputHandler.prototype.decodeButtons = function(e) {
    var btn = 0;
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
PreviewModule.InputHandler.prototype.preventDefault = function(e) {
    if (e && e.preventDefault) e.preventDefault();
}
PreviewModule.InputHandler.prototype.releaseCapture = function() {
    if (this.mouseCaptured) {
        var e = this.preview.canvas,
            i = this.input;
        this.mouseCaptured = false;
        this.mouseMovedWhileCaptured = false;
    }
}
PreviewModule.InputHandler.prototype.setCapture = function() {
    if (!this.mouseCaptured) {
        var e = this.preview.canvas,
            i = this.input;
        this.mouseCaptured = true;
        this.mouseMovedWhileCaptured = false;
    }
}

PreviewModule.InputHandler.prototype.handleObjSelect = function(x, y, event, bDown) {
    if (!bDown) {
        var ray = this.preview.getRay(x, y);
        var h = this.preview.hitTest(ray);
        var n = h ? h.node : null;
        var bCtrl = (event.ctrlKey == 1);
        var bSelect = true;
        if (bCtrl && n && n.state & 4) bSelect = false;
        this.preview.scene.Select(n, bSelect, bCtrl);
        this.preview.gui.tree.setSelectedObjects(this.preview.scene.selectedObjects);
    }
}
PreviewModule.InputHandler.prototype.getClientPoint = function(e) {
    var r = this.preview.canvas.getBoundingClientRect();
    var x, y;
    if (e) {
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

PreviewModule.InputHandler.prototype.onMouseUp = function(event) {
    var e = event;
    var p = this.getClientPoint(e);
    if (!this.mouseMovedWhileCaptured) this.handleObjSelect(this.LX, this.LY, event, false);
    this.releaseCapture();
};
PreviewModule.InputHandler.prototype.onDoubleClick = function(event) {
    this.preventDefault(event);
    event.stopPropagation();
    //TO-DO: Look at the selected camera (only if CTRL is not pressed... Else behave like a normal double click.)
    return true;
}

PreviewModule.InputHandler.prototype.onMouseDown = function(event) {
    this.setCapture();

    var e = event;
    var p = this.getClientPoint(e);
    this.LX = p.x;
    this.LY = p.y;
    p.b = this.decodeButtons(event);
    this.preventDefault(event);
}
PreviewModule.InputHandler.prototype.onMouseMove = function(event) {
    var e = event;
    var p = this.getClientPoint(e);
    var dX = p.x - this.LX,
        dY = p.y - this.LY;
    if (this.mouseCaptured && (Math.abs(dX) || Math.abs(dY))) {
        var b = p.b = this.decodeButtons(event);
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
        }
        this.preview.invalidate();
        this.LX = p.x;
        this.LY = p.y;

        this.mouseMovedWhileCaptured = true;
    }
}
PreviewModule.InputHandler.prototype.onMouseWheel = function(event) {
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
    this.preview.invalidate(IV.INV_VERSION);
    this.preventDefault(event);
}

// Scene Transformations
PreviewModule.InputHandler.prototype.doPan = function(dX, dY) {
    var v = this.preview.getView();
    var gl = this.gl;
    var x0 = gl.viewportWidth / 2,
        y0 = gl.viewportHeight / 2;
    var r0 = this.getRay(x0, y0);
    var r1 = this.getRay(x0 - dX, y0 - dY);
    var d = [r1[3] - r0[3], r1[4] - r0[4], r1[5] - r0[5]];
    vec3.add_ip(v.from, d);
    vec3.add_ip(v.up, d);
    vec3.add_ip(v.to, d);
    this.preview.setViewImp(v);
}
PreviewModule.InputHandler.prototype.doOrbit = function(dX, dY) {
    var v = this.preview.getView(),
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
    this.preview.setViewImp(v);
}
PreviewModule.InputHandler.prototype.doDolly = function(dX, dY) {
    var v = this.preview.getView();
    var dir = vec3.sub_r(v.from, v.to);
    var l = vec3.length(dir);
    var _l = l + l * dY / 100;
    if (_l < 1e-6) return false;
    vec3.scale_ip(dir, _l / l);
    var _new = vec3.add_r(v.to, dir);
    var delta = vec3.sub_r(_new, v.from);
    vec3.add_ip(v.from, delta);
    vec3.add_ip(v.up, delta);
    this.preview.setViewImp(v);
    return true;
}
PreviewModule.InputHandler.prototype.doFOV = function(dX, dY) {
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