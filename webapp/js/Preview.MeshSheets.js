/*
* Author: Mathieu Binette
* Features:
*   - MeshSheet system (for cases in between the single-json-file and the one-json-file-per-product)
*   - Error handling for failed AJAX queries (e.g. too many queries)
*   - A maximum of simultaneous requests to prevent the errors from happening in the first place.
*/

var MAX_SIMULTANEOUS_AJAX_REQUESTS = 50;

function CreateMeshRequest(f, p) {
    if (f == undefined) return null;
    var r = new XMLHttpRequest();
    path = f;
    if (p) 
        path = p + f;
    r._requestUrl = path;
    r.open("GET", path);
    return r;
}

function MeshSheets() {
    this.sheets = {}
    this.inQueue = 0;
    this.complete = false;
};
MeshSheets.prototype.add = function(sheet) {
    if(!sheet.length) sheet.length = 1; /*Default value for length*/
    sheet.request = null;
    this.sheets[sheet.ref] = sheet;
    return sheet;
};
MeshSheets.prototype.get = function(sheet) {
    return this.sheets[sheet.ref];
};
MeshSheets.prototype.remove = function(sheet) {
    delete this.sheets[sheet.ref];
};
MeshSheets.prototype.loadAll = function(scene) {
    var complete = true
    for(var i in this.sheets) {
        var sheet = this.sheets[i]
        if (this.inQueue >= MAX_SIMULTANEOUS_AJAX_REQUESTS)
            return; /* Don't hit the max! */

        if (sheet.request)
            continue; // Answer is on it's way!

        this.loadMeshSheet(scene, sheet);
        complete = false;
    }

    this.complete = complete && this.inQueue == 0;
};

MeshSheets.prototype.loadMeshSheet = function(scene, sheet) {
    var that = this;

    var url = sheet.ref;
    if(scene.path)
        url = scene.path + url;
    var request = CreateMeshRequest(url);
    if (request) {
        sheet.request = request;
        this.inQueue++;
        request.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var all_data = JSON.parse(this.responseText);
                if(all_data.constructor !== Array)
                    all_data = [all_data];
                for(var i in all_data) {
                    var data = all_data[i];
                    var mesh = new mesh3d(scene.gl);
                    mesh.initialize(scene, data);
                    if(data.guid && scene.objects3d[data.guid]) // Link with the node3d object
                        scene.objects3d[data.guid].setMesh(mesh);
                    scene.onMeshLoaded(mesh);
                }
                that.remove(sheet);

                that.inQueue--;
            }
        };

        request.onerror = function() {
            // If there is an error, we'll try again later.
            sheet.request = null;
            that.inQueue--;
        };

        request.send();
    }
}