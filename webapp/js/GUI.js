
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
GUI.prototype.displayTree = function(tree, level) {
	$("#tree .loading").hide();

	var spacing = ""
	if(!level) {
		level = 0;
	}
	else {
		for(var i = 0; i < level; i++)
			spacing += '&nbsp;&nbsp;';
	}

	for(i in tree) {
		node = tree[i];
		$("#tree .content").append("<div>" + spacing + node[0] + "</div>");
		this.displayTree(node[1], level + 1);
	}
}


GUI.Instance = new GUI();