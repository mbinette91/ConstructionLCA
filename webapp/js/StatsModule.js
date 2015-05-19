var StatsModule = function () {
    
};

StatsModule.prototype.initialize = function(){
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

StatsModule.prototype.initializeD3JS = function(){
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

StatsModule.prototype.refreshGraph = function(){
    var that = this;
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