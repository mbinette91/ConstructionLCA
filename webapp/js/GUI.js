
var GUI = function () {
    this.modules = [];
    this.fsManager = new FullScreenManager();
    this.stats = new StatsModule();
    this.tree = new TreeModule();
    this.registerModule(this.stats);
    this.registerModule(this.tree);
};

GUI.prototype.registerModule = function(module){
    this.modules.push(module);
    module.gui = this;
}

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

    var POOLING_INTERVAL = 1000; // Millis
    var that = this;
    var checkPreviewData = function(){
        $.ajax("/data/output-" + projectId + "/", {
            error: function(){
                setTimeout(checkPreviewData, POOLING_INTERVAL);
            },
            success: function(){
                that.initializePreview();
                that.getProjectInfo();
            }
        })
    };

    setTimeout(checkPreviewData, POOLING_INTERVAL);
};

GUI.prototype.getProjectInfo = function() {
    var that = this;
    $.ajax("/project/info?get=tree&id="+this.projectId, {
        error: function(){
            console.log("Error while loading project tree!");
        },
        success: function(data){
            that.tree.display(JSON.parse(data));
        }
    })
    // To-do: Are we sure this is loaded after the list of elements is loaded into the PreviewModule object ?
    $.ajax("/project/info?get=info&id="+this.projectId, {
        error: function(){
            console.log("Error while loading project info!");
        },
        success: function(data){
            data = JSON.parse(data);
            that.preview.setNodeInformation(data);
        }
    })
}

GUI.prototype.initializePreview = function() {
    var that = this;
    this.preview = new PreviewModule(document.getElementById("preview-canvas"), "tree.json", 0xcccccc, "/data/output-" + projectId + "/");
    this.preview.initialize();
    this.preview.refreshSizes = function() {
        var w = $("#section-container").width();
        var h = $("#section-container").height();
        $("#preview-canvas").attr("width", w);
        $("#preview-canvas").attr("height", h);
        that.preview.initHardware();
        that.preview.invalidate();
    };
    this.preview.refreshSizes();

    this.registerModule(this.preview);
}


GUI.prototype.handleWindowSizeChanged = function() {
    var that = this;

    setTimeout(function(){
        that.preview.refreshSizes();
        that.stats.refreshGraph();
    }, 10); // Artificial timeout because the layout plugin needs to update itself.
}

GUI.Instance = new GUI();