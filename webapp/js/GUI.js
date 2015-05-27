
var GUI = function () {
    this.fsManager = new FullScreenManager();
    this.unity = new UnityFacade();
    this.stats = new StatsModule();
};

GUI.prototype.initialize = function() {
    var that = this;
    var fn_onresize = 

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

    this.unity.initialize($("#unityPlayer"), function(){ 
        that.unity.sendMessageToUnity("GetTree"); 
    });
};


GUI.prototype.handleWindowSizeChanged = function() {
    var that = this;

    setTimeout(function(){
        that.stats.refreshGraph();
    }, 100); // Artificial timeout because the layout plugin needs to update itself.
}

GUI.prototype.generateTreeHTML = function(tree) {
    var list = $("<ul>")

    for(var i in tree) {
        var node = tree[i];
        var nodeType = 'type' + Math.floor((Math.random() * 3) + 1);
        var htmlNode = $("<li>" + node[0] + "</li>")
        htmlNode.data('jstree', {'type': nodeType}) // Insert data before appending to the list.
        list.append(htmlNode); // Insert into node before appending stuff into it.
        if(node[1] && node[1].length > 0)
            htmlNode.append( this.generateTreeHTML(node[1]) );
    }

    return list;
}

GUI.prototype.displayTree = function(tree) {
    that = this;
    $("#tree .loading").hide();

    $("#tree .content").append( this.generateTreeHTML(tree) );

    $('#tree .content').jstree({ 
        "core" : {
            "themes" : {
                "variant" : "medium",
                "dots" : false
            }
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
    var checkboxData = data.instance._model.data; // '#' contains info about all the other children
    var checkboxDataIndexes = checkboxData['#'].children_d;
    bitmap = ""
    for(var i = 0; i < checkboxDataIndexes.length; i++){
        var index = checkboxDataIndexes[i]
        if(index == data.node.id)
            that.unity.sendMessageToUnity("FocusOnObject-" + i);
    }
}


GUI.Instance = new GUI();