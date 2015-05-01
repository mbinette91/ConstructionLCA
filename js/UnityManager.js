/**
This class handles Unity interactions.
*/

var UnityManager = function ($unityPlayer) {
    this.$unityPlayer = $unityPlayer;
    this.unityObject = new UnityObject2({
        width: '100%', 
        height: '100%',
        params: { enableDebugging:"1" }
    });
};

UnityManager.prototype.initialize = function() {
    var $unityPlayer = this.$unityPlayer;
    var u = this.unityObject;

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

        u.initPlugin($unityPlayer, "UnityBuild/UnityBuild.unity3d");
    });
};

UnityManager.prototype.sendMessageToUnity = function(message) {
    console.log("Sending message to Unity message = " + message)
    this.unityObject.getUnity().SendMessage("Cube", "TalkToUnity", message);
}

function UnityJSCallback(args){
    console.log("Received UnityJSCallback with args = " + args);
    if(args == 'hidden') {
        $("#hide-cube").hide();
        $("#show-cube").show();
    }
    else {
        $("#hide-cube").show();
        $("#show-cube").hide();
    }
}