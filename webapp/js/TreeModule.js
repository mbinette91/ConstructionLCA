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
        var isLeaf = !$.isArray(node[1]);
        var nodeType = 'type' + Math.floor((Math.random() * 3) + 1);
        var htmlNode;
        if(!isLeaf)
            htmlNode = $("<li>" + node[0] + "</li>")
        else
            htmlNode = $("<li id='"+node[0]+"'>" + node[1] + "</li>")
        htmlNode.data('jstree', {'type': nodeType}) // Insert data before appending to the list.
        list.append(htmlNode); // Insert into node before appending stuff into it.
        if(!isLeaf && node[1].length > 0)
            htmlNode.append( this.generateTreeHTML(node[1]) );
    }

    return list;
}

TreeModule.prototype.display = function(tree) {
    that = this;
    this._selectingProgramatically = false;

    $("#tree .loading").hide();

    $("#tree .content").append( this.generateTreeHTML(tree) );

    var jstree = $('#tree .content').jstree({ 
        "core" : {
            "themes" : {
                "variant" : "medium",
                "dots" : false
            },
            "multiple": true
        },
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

    this.jstree = $(jstree).jstree();
}

TreeModule.prototype.handleSelectStatusChanged = function(e, data) {
    this.gui.preview.scene.clearSelected(); // Clear everything
    this.handleSelectStatusChangedData(data.selected);
    this.gui.preview.refreshSelectedObjectsInfo();
}
TreeModule.prototype.handleSelectStatusChangedData = function(selected_ids, selected_count) {
    if(!selected_count)
        selected_count = 0;

    for(var i in selected_ids) {
        var node = this.jstree.get_node(selected_ids[i])
        if(node.children.length > 0) {
            selected_count += this.handleSelectStatusChangedData(node.children, selected_count)
        }
        else {
            selected_count++;
            this.gui.preview.scene.selectObject(node.id, selected_count > 1); // Reselect everything
       }
    }

    return selected_count;
}