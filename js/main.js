
$(document).ready(function(){
    $('#tabs a').click(function(e) {
        e.preventDefault();
        $(this).tab('show');
    })

    FullScreenManager.initialize();
    FullScreenManager.addTriggerElement($("#fullscreen-trigger"));

    $("body").layout({ slidable: false, togglerLength_closed: -1, west: { size: $(".ui-layout-west").width() } });
})