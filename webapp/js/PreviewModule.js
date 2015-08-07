/**
* This class handles the Preview tab.
* Supported on most browsers.
*/

function PreviewModule(canvas) {
    this.scene = null; // You must call PreviewModule::loadScene!
    this.canvas = canvas;
    this.bgColor = rgb(102, 102, 102);
    this.input = new PreviewModule.InputHandler(this);
    this._drawScene_Timeout = false;
}

PreviewModule.prototype.initialize = function(file, path) {
    if (this.initializeGL()) {
        this.loadScene(file, path);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.input.initialize();
        this.invalidate();
    }
    else
        console.log("PreviewModule.initialize: Could not initialize WebGL.");
}

PreviewModule.prototype.initializeGL = function() {
    var n = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var i = 0; i < n.length; i++) {
        try {
            this.gl = this.canvas.getContext(n[i], { alpha: false });
            if (this.gl) {
                this.gl.viewportWidth = this.canvas.width;
                this.gl.viewportHeight = this.canvas.height;
                break;
            }
        } catch (e) { 
            continue; // Ignore the failed context-get and try the next one!
        }
    }
    return this.gl != null;
}

PreviewModule.prototype.loadScene = function(file, path) {
    var that = this;
    this.scene = new Scene(this, this.gl, path);
    var r = new XMLHttpRequest();
    r.open("GET", path + file);
    r.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            that.scene.load(JSON.parse(this.responseText));
        }
    }
    r.send();
}

PreviewModule.prototype.setSize = function(width, height) {
    $(this.canvas).attr("width", width);
    $(this.canvas).attr("height", height);
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;
    this.invalidate();
};

PreviewModule.prototype.setNodeInformation = function(data) {
    var scene = this.scene;
    for(var i in data) {
        var obj = scene.objects3d[data[i].guid];
        if(obj){
            obj.data = data[i];
            var mat = scene.materials.search(data[i]);
            obj.setMaterial(scene, mat);
            if(mat.name == "invisible")
                scene.remove(obj);
        }
    }
}

PreviewModule.prototype.drawScene = function() {
    var gl = this.gl;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(this.bgColor[0], this.bgColor[1], this.bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.scene.render();
    this._drawScene_Timeout = null;
}

PreviewModule.prototype.invalidate = function(f) {
    if (this._drawScene_Timeout) 
        return;
    
    this._drawScene_Timeout = setTimeout(this.drawScene.bind(this), 1);

    this.refreshSelectedObjectsInfo();
}