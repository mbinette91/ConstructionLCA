
var GUI = function () {
    this.fsManager = new FullScreenManager();
    this.unity = new UnityFacade();
};

GUI.prototype.initialize = function() {
    this.initializeTabs();
    this.initializeLayout();
    this.initializeFullScreenManager();
    this.initializeStats();
    this.initializeUnity();

    var that = this;
    $(window).resize( function(){ that.handleWindowSizeChanged(); } );
};


GUI.prototype.handleWindowSizeChanged = function() {
    var that = this;
    setTimeout(function(){
        that.refreshGraph();
    }, 250); // Artificial timeout because the layout plugin needs to update itself.
}

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
    }, 10);

    this.initializeD3JS();
}

GUI.prototype.initializeD3JS = function(){
    var width = $("#section-container").width(),
        height = $("#section-container").height();

    var that = this
    this.xRange = d3.scale.linear()
        .range([0, width]);

    this.yRange = d3.scale.linear()
        .range([0, height]);

    var color = d3.scale.category20c();

    var partition = d3.layout.partition()
        .children(function(d) { return isNaN(d.value) ? d3.entries(d.value) : null; })
        .value(function(d) { return d.value; });

    var svg = d3.select("#Stats").append("svg")
        .attr("width", width)
        .attr("height", height);


    that.rect = svg.selectAll("rect");


    this.clicked = function (d) {
      that.xRange.domain([d.x, d.x + d.dx]);
      that.yRange.domain([d.y, 1]).range([d.y ? 20 : 0, height]);

      that.rect.transition()
          .duration(750)
          .attr("x", function(d) { return that.xRange(d.x); })
          .attr("y", function(d) { return that.yRange(d.y); })
          .attr("width", function(d) { return that.xRange(d.x + d.dx) - that.xRange(d.x); })
          .attr("height", function(d) { return that.yRange(d.y + d.dy) - that.yRange(d.y); });
    }

    d3.json("data.json", function(error, root) {
      that.rect = that.rect
          .data(partition(d3.entries(root)[0]))
        .enter().append("rect")
          .attr("x", function(d) { return that.xRange(d.x); })
          .attr("y", function(d) { return that.yRange(d.y); })
          .attr("width", function(d) { return $(window).width(); })
          .attr("height", function(d) { return  $(window).height(); })
          .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
          .on("click", that.clicked);
    });
}

GUI.prototype.refreshGraph = function(){
    var width = $("#section-container").width(),
        height = $("#section-container").height();

    this.xRange.range([0, width]);
    this.yRange.range([0, height]);

    var svg = $("#Stats svg")
        .attr("width", width)
        .attr("height", height);

      that.rect.transition()
          .attr("x", function(d) { return that.xRange(d.x); })
          .attr("y", function(d) { return that.yRange(d.y); })
          .attr("width", function(d) { return that.xRange(d.x + d.dx) - that.xRange(d.x); })
          .attr("height", function(d) { return that.yRange(d.y + d.dy) - that.yRange(d.y); });
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