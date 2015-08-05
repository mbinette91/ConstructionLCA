
var GUI = function () {
    this.modules = [];
    this.fsManager = new FullScreenManager();
    this.preview = new PreviewModule($("#preview-canvas")[0]);
    this.stats = new StatsModule();
    this.tree = new TreeModule();
    this.registerModule(this.preview);
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

    try {
        this.fsManager.initialize();
        this.fsManager.addTriggerElement($("#fullscreen-trigger"));
    } catch (err) {
        console.log("Cannot initialize FullScreenManager");
    }

    try {
        this.stats.initialize();
    } catch (err) {
        console.log("Cannot initialize StatsManager");
    }

    var POOLING_INTERVAL = 1000; // Millis
    var that = this;
    var checkPreviewData = function(){
        $.ajax("/data/output-" + projectId + "/", {
            error: function(){
                setTimeout(checkPreviewData, POOLING_INTERVAL);
            },
            success: function(){
                that.preview.initialize("tree.json", "/data/output-" + projectId + "/");
                that.handleWindowSizeChanged();
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

GUI.prototype.handleWindowSizeChanged = function() {
    var that = this;

    setTimeout(function(){
        var w = $("#section-container").width();
        var h = $("body").height() - $("#tabs").height();
        that.preview.setSize(w, h);
        that.stats.setSize(w, h);
    }, 10); // Artificial timeout because the layout plugin needs to update itself.
}

GUI.Instance = new GUI();