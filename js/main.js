
$(document).ready(function(){
    $('#tabs a').click(function(e) {
        e.preventDefault();
        if(!$(this).parents('.disabled').exists()){
            $(this).tab('show');
        }
    })

    FullScreenManager.initialize();
    FullScreenManager.addTriggerElement($("#fullscreen-trigger"));

    $("body").layout({ slidable: false, togglerLength_closed: -1, west: { size: $(".ui-layout-west").width() } });

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
})