function TreeModule() {

}

TreeModule.prototype.setSelectedObjects = function(objects)
{
    this._selectingProgramatically = true;
    $('#tree .content').jstree().deselect_all();
    for(i in objects) {
    	$('#tree .content').jstree().select_node(objects[i].data.guid);
    }
    this._selectingProgramatically = false;
}

TreeModule.prototype.generateTreeHTML = function(tree) {
    var list = $("<ul>")

    for(var i in tree) {
        var node = tree[i];
        var nodeType = 'type' + Math.floor((Math.random() * 3) + 1);
        var htmlNode = $("<li id='"+node[0]+"'>" + node[1] + "</li>")
        htmlNode.data('jstree', {'type': nodeType}) // Insert data before appending to the list.
        list.append(htmlNode); // Insert into node before appending stuff into it.
        if(node[1] && node[1].length > 0)
            htmlNode.append( this.generateTreeHTML(node[2]) );
    }

    return list;
}

TreeModule.prototype.display = function(tree) {
    that = this;
    this._selectingProgramatically = false;

    $("#tree .loading").hide();

    $("#tree .content").append( this.generateTreeHTML(tree) );

    $('#tree .content').jstree({ 
        "core" : {
            "themes" : {
                "variant" : "medium",
                "dots" : false
            },
            "multiple": true
        },
        //"checkbox": {
        //    'tie_selection':false
        //},
        "types" : {
            "type1" : {
                "icon" : "glyphicon-type1"
            },
            "type2" : {
                "icon" : "glyphicon-type2"
            },
            "type3" : {
                "icon" : "glyphicon-type3"
            },
        },
        "plugins" : [ "wholerow", 'types'] // , "checkbox"]
    }).on("select_node.jstree", function (e, data) {
        if(!that._selectingProgramatically)
            that.handleSelectStatusChanged(e, data)
    }).on("deselect_node.jstree", function (e, data) {
        if(!that._selectingProgramatically)
            that.handleSelectStatusChanged(e, data)
    }).jstree("check_all", true);
}

TreeModule.prototype.handleSelectStatusChanged = function(e, data) {
	this.gui.preview.scene.clearSelected(); // Clear everything
	for(var i in data.selected)
    	this.gui.preview.scene.selectObject(data.selected[i], data.selected.length > 1); // Reselect everything
    this.gui.preview.refreshSelectedObjectsInfo();
}