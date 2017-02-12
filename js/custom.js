d3.queue()
    .defer(d3.csv,'web_files/grouped_0.csv')
    .defer(d3.csv,'web_files/grouped_2.csv')
    .defer(d3.csv,'web_files/grouped_3.csv')
    .defer(d3.json,'js/western_us.geojson')
    .await(function(error, el_year, el_year_month, state_el_year, map) {

        var margins = {top: 25, right: 40, bottom: 50, left: 75};
        var temp_colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
        var parse_date = d3.timeParse("%m/%Y"),
            parse_year = d3.timeParse("%Y"),
            height = 500 - margins.top - margins.bottom,
            full_width = window.innerWidth,
            type = (full_width <= 500) ? "%y" : "%Y",
            width =  full_width - 100 - margins.right - margins.left;

        var $ = d3.select;
        var $$ = d3.selectAll;

        var div = $("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var state_list = {
            AZ: 'Arizona',
            CA: 'California',
            CO: 'Colorado',
            ID: 'Idaho',
            MT: 'Montana',
            NV: 'Nevada',
            NM: 'New Mexico',
            OR: 'Oregon',
            UT: 'Utah',
            WA: 'Washington',
            WY: 'Wyoming'
        };

        var sizing;

        if (full_width < 500) {
            sizing = [1, 6];
        } else {
            sizing = [2, 20];
        }

        el_year.forEach(function(d) {
            d.date = parse_year(d.year);
            d.snow_mean = +d.snow_mean;
            d.temp_mean = +d.temp_mean;
            d.elev = d.elev + '000';
        });

        el_year_month.forEach(function(d) {
            d.date = parse_date(d.month + '/' + d.year);
            d.snow_mean = +d.snow_mean;
            d.temp_mean = +d.temp_mean;
        });

        state_el_year.forEach(function(d) {
            d.date = parse_year(d.year);
            d.snow_mean = +d.snow_mean;
            d.temp_mean = +d.temp_mean;
            d.elev = d.elev + '000';
        });

        build(el_year, '#year-month', 20);
        build(el_year_month, '#el-year-month', 5);


        var states = _.keys(state_list);
        var colors = d3.scaleQuantile()
            .domain(d3.extent(state_el_year, d3.f('temp_mean')))
            .range(temp_colors);

        var circleRadius = d3.scaleSqrt()
            .domain(d3.extent(state_el_year, d3.f('snow_mean')))
            .range(sizing);

        drawLegend("#states-legend-temp", colors);
        legendCircle("#states-legend", circleRadius);

        states.forEach(function(state, i) {
            var data = state_el_year.filter(function(d) {
                return d.state === state;
            });

            $("#states").append("div")
                .attr("class", "graph")
                .attr("id", "graphed" + i);

            drawMap("#graphed" + i, 100, window.innerWidth, state);

            $("#graphed" + i)
                .append("h2")
                .attr("class", "text-center text-top")
                .text(state_list[state]);

            var elevations = _.pluck(_.uniq(data, 'elev'), 'elev');
            var xYearScale = timeScale(data, 'date', width);
            var yYearScale = ordinalScale(elevations, elevations.length * 45);

            var xYearAxis = d3.axisTop()
                .scale(xYearScale)
                .tickFormat(d3.timeFormat(type));

            var yYearAxis = d3.axisLeft()
                .scale(yYearScale)
                .tickFormat(d3.format(",d"));

            var svg_year = $("#graphed" + i).append('svg')
                .attr("id", state)
                .attr("width", width + margins.left + margins.right)
                .attr("height", elevations.length * 50);

            makeXAxis(svg_year, xYearAxis, true);
            makeYAxis(svg_year, yYearAxis);

            var circles = svg_year.selectAll('circle').data(data);
            circles.enter().append('circle')
                .merge(circles)
                .translate([margins.left, margins.top])
                .style('fill', function(d) {
                    return colors(d.temp_mean);
                })
                .attr('cx', function(d) { return xYearScale(d.date); })
                .attr('cy', function(d) { return yYearScale(d.elev); })
                .attr('r', function(d) {
                    return circleRadius(d.snow_mean);
                })
                .on('mouseover touchstart', function(d) {
                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + d.date.getFullYear() + '</h4>' +
                                '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                                '<ul class="list-unstyled"' +
                                '<li>Elevation: ' + d.elev + '+ feet</li>' +
                                '<li>Temp Mean: ' + d.temp_mean + ' degrees</li>' +
                                '<li>Water Mean: ' + d.snow_mean + ' inches</li>' +
                                '<li>Water Median: ' + d.snow_median + ' inches</li>' +
                                '</ul>'
                        )
                        .style("top", (d3.event.pageY+18)+"px")
                        .style("left", (d3.event.pageX-55)+"px");

                    d3.select(this).attr('r', circleRadius(d.snow_mean) * 1.3);
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                    d3.select(this).attr('r', circleRadius(d.snow_mean));
                });

            circles.exit().remove();

            if(full_width >= 500) {
                if(state === 'AZ') {
                    var az_annotations = [
                        {
                            "xVal": parse_year('2009'),
                            "yVal": 6000,
                            "path": "M104,43L83,29",
                            "text": "Max Temp Levels",
                            "textOffset": [57, 54]
                        }
                    ];

                    annotate("#AZ", az_annotations, xYearScale, yYearScale);
                }

                if(state === 'CA') {
                    var ca_annotations = [
                        {
                            "xVal": parse_year('2015'),
                            "yVal": 5000,
                            "path": "M97,43L77,27",
                            "text": "Min Water Levels",
                            "textOffset": [57, 54]
                        }
                    ];

                    annotate("#CA", ca_annotations, xYearScale, yYearScale);
                }

                if(state === 'CO') {
                    var co_annotations = [
                        {
                            "xVal": parse_year('2002'),
                            "yVal": 9000,
                            "path": "M46,-23L69,19",
                            "text": "Min Temp Levels",
                            "textOffset": [16, -25]
                        }
                    ];

                    annotate("#CO", co_annotations, xYearScale, yYearScale);
                }

                if(state === 'WA') {
                    var wa_annotations = [
                        {
                            "xVal": parse_year('2012'),
                            "yVal": 6000,
                            "path": "M110,-5L91,13",
                            "text": "Max Water Levels",
                            "textOffset": [87, -11]
                        }
                    ];

                    annotate("#WA", wa_annotations, xYearScale, yYearScale);
                }
            }

            function makeXAxis(svg, axis, top) {
                var offset = (top) ? 0 : height;
                svg.append("g")
                    .attr("class", "axis x")
                    .translate([margins.left, offset + margins.top]);

                d3.select("#graphed" + i + " g.x").call(axis);
            }

            function makeYAxis(svg, axis) {
                svg.append("g")
                    .attr("class", "axis y")
                    .translate([margins.left - 25, margins.top]);

                d3.select("#graphed" + i + " g.y").call(axis);
            }

        });

        function build(data, selector, max) {
            var offset = (max > 5 || full_width < 500) ? 0 : 10;
            var which_size = (max > 5) ? sizing : [1, 3];
            var coloring = (max > 5) ? temp_colors.reverse() : temp_colors;
            var colors = d3.scaleQuantile()
                .domain(d3.extent(data, d3.f('temp_mean')))
                .range(coloring);

            var circleRadius = d3.scaleSqrt()
                .domain(d3.extent(data, d3.f('snow_mean')))
                .range(which_size);

            drawLegend(selector + "-legend-temp", colors);
            legendCircle(selector + "-legend", circleRadius);


            var xYearScale = timeScale(data, 'date', width);
            var elevations = _.pluck(
                _.uniq(data, function(d) { return d.elev; }), 'elev'
            );
            var yYearScale = ordinalScale(elevations, height);

            var xYearAxis = d3.axisBottom()
                .scale(xYearScale)
                .tickFormat(d3.timeFormat(type));

            var yYearAxis = d3.axisLeft()
                .scale(yYearScale)
                .tickFormat(d3.format(",d"));

            var svg_year = $(selector).append('svg')
                .attr("id", "graph-" + max)
                .attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom);

            makeXAxis(svg_year, xYearAxis, true);
            makeYAxis(svg_year, yYearAxis);

            var circles = svg_year.selectAll('circle').data(data);
            circles.enter().append('circle')
                .merge(circles)
                .translate([margins.left - offset, margins.top])
                .style('fill', function(d) {
                    return colors(d.temp_mean);
                })
                .attr('cx', function(d) { return xYearScale(d.date); })
                .attr('cy', function(d) { return yYearScale(d.elev); })
                .attr('r', function(d) {
                    return circleRadius(d.snow_mean);
                })
                .on('mouseover touchstart', function(d) {
                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    var month = (max > 5) ? '' : ' (' + monthWord(d.date.getUTCMonth()) + ')';
                    div.html(
                            '<h4 class="text-center">' + d.date.getFullYear() + month + '</h4>' +
                                '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                                '<ul class="list-unstyled"' +
                                '<li>Elevation: ' + d.elev + '+ feet</li>' +
                                '<li>Temp Mean: ' + d.temp_mean + ' degrees</li>' +
                                '<li>Water Mean: ' + d.snow_mean + ' inches</li>' +
                                '<li>Water Median: ' + d.snow_median + ' inches</li>' +
                                '</ul>'
                        )
                        .style("top", (d3.event.pageY+18)+"px")
                        .style("left", (d3.event.pageX-55)+"px");

                    d3.select(this).attr('r', circleRadius(d.snow_mean) * 1.3);
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                    d3.select(this).attr('r', circleRadius(d.snow_mean));
                });

            circles.exit().remove();

            if(max === 20 && full_width >= 500) {
                var year_annotations = [
                    {
                        "xVal": parse_year('2008'),
                        "yVal": 3000,
                        "path": "M112,93L89,38",
                        "text": "Max Water Levels",
                        "textOffset": [73, 109]
                    },
                    {
                        "xVal": parse_year('2005'),
                        "yVal": 2000,
                        "path": "M96,67L76,27",
                        "text": "Min Water Levels",
                        "textOffset": [63, 83]
                    },
                    {
                        "xVal": parse_year('2002'),
                        "yVal": 10000,
                        "path": "M35,-13L69,19",
                        "text": "Min Temp Levels",
                        "textOffset": [-7, -18]
                    },
                    {
                        "xVal": parse_year('2016'),
                        "yVal": 3000,
                        "path": "M36,93L66,33",
                        "text": "Max Temp Levels",
                        "textOffset": [-3, 112]
                    }
                ];

                annotate("#graph-" + max, year_annotations, xYearScale, yYearScale);
            }

            function makeXAxis(svg, axis, top) {
                var offset = (top) ? 0 : height;
                svg.append("g")
                    .attr("class", "axis x")
                    .translate([margins.left, offset + margins.top]);

                d3.select(selector + " g.x").call(axis);
            }

            function makeYAxis(svg, axis) {
                svg.append("g")
                    .attr("class", "axis y")
                    .translate([margins.left - 25, margins.top]);

                d3.select(selector + " g.y").call(axis);
            }
        }

        function timeScale(data, field, size) {
            var scale = d3.scaleTime()
                .range([0, size]);
            scale.domain(d3.extent(data, d3.f(field)));

            return scale;
        }

        function ordinalScale(data, size) {
            var scale = d3.scaleBand()
                .rangeRound([size, 0])
                .padding(1);

            scale.domain(data);

            return scale;
        }

        function annotate(selector, annotations, xScale, yScale) {
            var swoopy = d3.swoopyDrag()
                .x(function(d){ return xScale(d.xVal); })
                .y(function(d){ return yScale(d.yVal); })
                .draggable(0);

            swoopy.annotations(annotations);

            $(selector).append("g.annotations").call(swoopy);
        }

      /*  function draw_overlay(point) {
            point
                .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });
        }

        function draw_overlay(d) {
            return d.length ? "M" + d.join("L") + "Z" : null;
        }

        function overlayLayer(layer, data, xScale, yScale, offset) {
            var voronoi = d3.voronoi()
                .x(function(d) { return xScale(d.date); })
                .y(function(d) { return yScale(d.elev); })
                .extent([[0, 0], [width, height]]);

            layer.attr("class", "cell")
                .selectAll("path")
                .data(voronoi.polygons(data))
                .enter().append("path")
                .attr("d", function(d) { return draw_overlay(d); })
                .translate([margins.left - offset, margins.top])
                .style('fill', 'none')
                .style('stroke', 'white')
                .style('pointer-events', 'all')
                .on('mouseover touchstart', function(d) {
                    console.log(d)
                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + d.date.getFullYear() + '</h4>' +
                                '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                                '<ul class="list-unstyled"' +
                                '<li>Elevation: ' + d.elev + '+ feet</li>' +
                                '<li>Temp Mean: ' + d.temp_mean + ' degrees</li>' +
                                '<li>Water Mean: ' + d.snow_mean + ' inches</li>' +
                                '<li>Water Median: ' + d.snow_median + ' inches</li>' +
                                '</ul>'
                        )
                        .style("top", (d3.event.pageY+18)+"px")
                        .style("left", (d3.event.pageX-55)+"px");
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", 0);
                });

            layer.exit().remove();

      
        } */

        function legendCircle(selector, scaling) {
            var width = window.innerWidth;
            var orientation, yOffset;

            if(width < 1000) {
                orientation = 'vertical';
                yOffset = 10;
            } else {
                orientation = 'horizontal';
                yOffset = 25;
            }

            var padding = (/el/.test(selector)) ? 30 : 15;
            var legend_height = (orientation === 'vertical') ? 230 : 75;
            var legend_width = (width < 1000) ? 200 : 900;

            var svg = $(selector)
                .classed("svg", true)

                .attr("width", legend_width)
                .attr("height", legend_height);

            svg.append("g")
                .attr("class", "legendSize")
                .translate([30, yOffset]);

            var legendSize = d3.legendSize()
                .scale(scaling)
                .shape('circle')
                .shapePadding(padding)
                .labelOffset(20)
                .orient(orientation);

            svg.select(".legendSize")
                .call(legendSize);

            return svg;
        }

        function drawLegend(selector, colors) {
            var width = window.innerWidth;
            var size, orientation;

            if(width < 1000) {
                size = 40;
                orientation = 'vertical';
            } else {
                size = 70;
                orientation = 'horizontal';
            }

            var legend_height = (orientation === 'vertical') ? 230 : 75;
            var legend_width = (width < 1000) ? 200 : 900;

            var class_name = selector.substr(1);
            var svg = $(selector)
                .classed("svg", true)
                .classed("legend", true)
                .attr("width", legend_width)
                .attr("height", legend_height);

            svg.append("g")
                .attr("class", "legend-" + class_name)
                .attr("width", legend_width)
                .translate([0, 20]);

            var legend = d3.legendColor()
                .shapeWidth(size)
                .orient(orientation)
                .labelFormat(d3.format(".01f"))
                .scale(colors);

            svg.select(".legend-" + class_name)
                .call(legend);

            return svg;
        }

        function drawMap(selector, height, width, state) {
            var mover = window.innerWidth / 2;
            var map_svg = $(selector).append('svg')
                .attr("vector-effect", "non-scaling-stroke")
                .append('g');

            var scale = 1,
                projection = d3.geoAlbersUsa()
                    .scale(scale)
                    .translate([0,0]);

            var path = d3.geoPath().projection(projection);
            var bounds = path.bounds(map);
            scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
            var translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2 -35,
                (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

            projection = d3.geoAlbersUsa().scale(scale).translate(translation);
            path = path.projection(projection);

            $(selector + " svg").attr('height', height)
                .attr('width', width)
                .attr('class', 'map');

            var map_draw = map_svg.selectAll("path")
                .data(map.features);

            map_draw.enter()
                .append("path")
                .merge(map_draw)
                .attr("d", path)
                .style("stroke", function(d) {
                    if(state_list[state] === d.properties.name) {
                        return 'orange';
                    }
                })
                .style("opacity", function(d) {
                    if(state_list[state] === d.properties.name) {
                        return .8;
                    }
                })
                .style("fill", function(d) {
                    if(state_list[state] === d.properties.name) {
                        return 'orange';
                    }
                });

            map_draw.exit().remove()
        }

        function monthWord(m) {
            switch(m) {
                case 0:
                    return "January";
                    break;
                case 1:
                    return "February";
                    break;
                case 2:
                    return "March";
                    break;
                case 3:
                    return "April";
                    break;
                case 4:
                    return "May";
                    break;
                case 5:
                    return "June";
                    break;
                case 6:
                    return "July";
                    break;
                case 7:
                    return "August";
                    break;
                case 8:
                    return "September";
                    break;
                case 9:
                    return "October";
                    break;
                case 10:
                    return "November";
                    break;
                case 11:
                    return "December";
                    break;
                default:
                    return "unknown";
            }
        }

        var rows = $$('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        $$('#load').classed('hide', true);
    });