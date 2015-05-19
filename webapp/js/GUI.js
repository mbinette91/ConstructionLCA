
var GUI = function () {
    this.fsManager = new FullScreenManager();
    this.unity = new UnityFacade();
};

GUI.prototype.initialize = function() {
    this.initializeTabs();
    this.initializeLayout();
    this.initializeFullScreenManager();
    this.initializeUnity();
};

GUI.prototype.initializeTabs = function() {
    $('#tabs a').click(function(e) {
        e.preventDefault();
        if(!$(this).parents('.disabled').exists()){
            $(this).tab('show');
        }
    })
};

GUI.prototype.initializeLayout = function() {
    $("body").layout({ slidable: false, togglerLength_closed: -1, west: { size: $(".ui-layout-west").width() } });
};

GUI.prototype.initializeFullScreenManager = function() {
    this.fsManager.initialize();
    this.fsManager.addTriggerElement($("#fullscreen-trigger"));
};

GUI.prototype.initializeStats = function(){
    var statsPercentLoaded = 0;
    var statsLoadStatusPolling = setInterval(function(){
        statsPercentLoaded += 1.5; 
        if(statsPercentLoaded >= 50){
            $("nav .stats").removeClass('disabled');
        }
        if(statsPercentLoaded >= 100){
            statsPercentLoaded = 100;
            clearInterval(statsLoadStatusPolling);
            setTimeout(function(){
                $('.progress').fadeOut();
            }, 2000);
        }
        $('.progress-bar').css('width', statsPercentLoaded+'%').attr('aria-valuenow', statsPercentLoaded); 
    }, 100);
}

GUI.prototype.initializeUnity = function(){
    that = this;
    this.unity.initialize($("#unityPlayer"), that.initializeUnity_callback);
}

GUI.prototype.initializeUnity_callback = function() {
    that.unity.sendMessageToUnity("GetTree");
}

/* Real functions */
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
        "checkbox": {
            'tie_selection':false
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
        "plugins" : [ "wholerow", "checkbox", 'types' ]
    }).on("check_node.jstree", function (e, data) {
        that.handleTreeStatusChanged(e, data)
    }).on("uncheck_node.jstree", function (e, data) {
        that.handleTreeStatusChanged(e, data)
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


GUI.Instance = new GUI();