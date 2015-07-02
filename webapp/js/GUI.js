
var GUI = function () {
    this.fsManager = new FullScreenManager();
    this.stats = new StatsModule();
};

GUI.prototype.initialize = function(projectId) {
    var that = this;
    this.projectId = projectId;

    $("body").layout({ 
        slidable: false, 
        togglerLength_closed: -1,
        west: { size: $(".ui-layout-west").width() }, 
        onresize: function(){ 
            that.handleWindowSizeChanged(); 
        }
    });

    $('#tabs a').click(function(e) {
        e.preventDefault();
        if(!$(this).parents('.disabled').exists()){
            $(this).tab('show');
        }
    })

    this.fsManager.initialize();
    this.fsManager.addTriggerElement($("#fullscreen-trigger"));

    this.stats.initialize();

    this.preview = new ivwindow3d(document.getElementById("preview-canvas"), "tree.json", 0xcccccc, "/data/output-" + projectId + "/");
    this.preview.refreshSizes = function() {
        var w = $("#section-container").width();
        var h = $("#section-container").height();
        $("#preview-canvas").attr("width", w);
        $("#preview-canvas").attr("height", h);
        that.preview.initHardware();
    };
    this.preview.refreshSizes();
};


GUI.prototype.handleWindowSizeChanged = function() {
    var that = this;

    setTimeout(function(){
        that.preview.refreshSizes();
        that.stats.refreshGraph();
    }, 100); // Artificial timeout because the layout plugin needs to update itself.
}

GUI.prototype.generateTreeHTML = function(tree) {
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

GUI.prototype.displayTree = function(tree) {
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
            "multiple": false
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
    }).on("check_node.jstree", function (e, data) {
        that.handleTreeStatusChanged(e, data)
    }).on("uncheck_node.jstree", function (e, data) {
        that.handleTreeStatusChanged(e, data)
    }).on("select_node.jstree", function (e, data) {
        if(!that._selectingProgramatically)
            that.handleSelectStatusChanged(e, data)
    }).jstree("check_all", true);
}

GUI.prototype.handleTreeStatusChanged = function(e, data) {
    var checkboxData = data.instance._model.data; // '#' contains info about all the other children
    var checkboxDataIndexes = checkboxData['#'].children_d;
    bitmap = ""
    for(var i = 0; i < checkboxDataIndexes.length; i++){
        var index = checkboxDataIndexes[i]
        bitmap += checkboxData[index].state.checked? '1' : '0';
    }
    that.unity.sendMessageToUnity("SetTreeVisibility-" + bitmap);
}

GUI.prototype.handleSelectStatusChanged = function(e, data) {
    that.unity.sendMessageToUnity("FocusOnObject-" + data.node.id);
}

GUI.prototype.setSelectedObject = function(args) {
    this._selectingProgramatically = true;
    $('#tree .content').jstree().deselect_all();
    $('#tree .content').jstree().select_node(args);
    this._selectingProgramatically = false;
}


GUI.Instance = new GUI();