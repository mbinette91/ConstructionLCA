/**
This class handles going in and out of Fullscreen mode.
Supported on most (but not all) browsers.
*/

var FullScreenManager = function () {
    this.triggers = []
};

FullScreenManager.prototype.initialize = function() {
    var that = this;
    $(window).resize(function () {
        that.refreshTriggers();
    })
};

FullScreenManager.prototype.isFullScreen = function() {
    return ((window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height));
};

FullScreenManager.prototype.goFullscreen = function() {
    console.log("Going FullScreen...");

    var element = document.documentElement;
    if(element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

FullScreenManager.prototype.exitFullscreen = function() {
    console.log("Exiting FullScreen...");

    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

FullScreenManager.prototype.triggerFullscreen = function() {
    if(this.isFullScreen())
        this.exitFullscreen()
    else
        this.goFullscreen();
}

FullScreenManager.prototype.refreshTriggers = function() {
    if(this.isFullScreen()) {
        for(i in this.triggers)
            $(this.triggers[i]).addClass("active");
    }
    else {
        for(i in this.triggers)
            $(this.triggers[i]).removeClass("active");
    }
}

FullScreenManager.prototype.addTriggerElement = function(element) {
    this.triggers.push(element);

    var that = this;
    $(element).click(function () {
        that.triggerFullscreen();
    })

    this.refreshTriggers();
}