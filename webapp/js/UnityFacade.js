/**
This class handles Unity interactions. 
Can only be instanciated and initialized once.
*/

UnityFacade = function() {
    if(!this._initialized) {
        UnityFacade._MainInstance = this;
    }
    else {
        throw "UnityFacade can only be instanciated once!"
    }
}
UnityFacade._MainInstance = null; // Can only be initialized once!

UnityFacade.prototype.initialize = function(projectId, $unityPlayer, callback) {
    if(!this._initialized) {
        this._initialized = true;
        this._callback = callback;

        this.$unityPlayer = $unityPlayer;
        var u = new UnityObject2({
            width: '100%', 
            height: '100%',
            params: { enableDebugging:"1" }
        });
        this.unityObject = u;

        jQuery(function() {
            var $missingScreen = $unityPlayer.find(".missing");
            var $brokenScreen = $unityPlayer.find(".broken");
            $missingScreen.hide();
            $brokenScreen.hide();
            
            u.observeProgress(function (progress) {
                switch(progress.pluginStatus) {
                    case "broken":
                        $brokenScreen.find("a").click(function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            u.installPlugin();
                            return false;
                        });
                        $brokenScreen.show();
                    break;
                    case "missing":
                        $missingScreen.find("a").click(function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            u.installPlugin();
                            return false;
                        });
                        $missingScreen.show();
                    break;
                    case "installed":
                        $missingScreen.remove();
                    break;
                    case "first":
                    break;
                }
            });

            u.initPlugin($unityPlayer, "UnityBuilds/Build-" + projectId + ".unity3d");
        });
    }
    else {
        throw "UnityFacade can only be initialized once!"
    }
};

UnityFacade.prototype.sendMessageToUnity = function(message) {
    if(!this._initialized) {
        throw "UnityFacade must be initialized before using this method (UnityFacade::sendMessageToUnity)!"
    }
    console.log("Sending message to Unity type = " + message)

    this.unityObject.getUnity().SendMessage("Controller", "HandleMessage", message);
}

UnityFacade.prototype.handleMessage = function(type, args) {
    if(!this._initialized) {
        throw "UnityFacade must be initialized before using this method (UnityFacade::handleMessage)!"
    }
    console.log("Received UnityFacade_MessageHandler with type = " + type);

    switch(type) {
        case 'DoneLoading':
            if(this._callback)
                this._callback();
            break;
        case 'SetTree':
            GUI.Instance.displayTree(args);
            break;
    }
}

function UnityFacade_HandleMessage(type, args) {
    if( !UnityFacade._MainInstance ) {
        throw "UnityFacade's MainInstance has not been defined yet!"
    }

    UnityFacade._MainInstance.handleMessage(type, args);
}