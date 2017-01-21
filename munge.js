var fs = require('fs');
var d3 = require('d3');
var _ = require('lodash');
var R = require('ramda');
var stringify = require('csv-stringify');

fs.readFile('all.csv', 'utf8', function(e, snow_levels) {
    var data = d3.csv.parse(snow_levels);

    var year_month = rollingTwo('year', 'month', data);
    var state_year_month = rollingThree('state', 'year', 'month', data);
    var el_year_month  = rollingThree('elevation', 'year', 'month', data);
    var state_el_year_month  = rollingFour('state', 'elevation', 'year', 'month', data);

    function stats() {
        return function(values) {
            return {
                total: _.uniq(values, function(d) { return d.site_id; }).length,
                snow_mean: d3.mean(values, function(d) {return d.swe; }),
                snow_median: d3.median(values, function(d) {return d.swe; }),
                temp_mean: d3.mean(values, function(d) {return d.temp_avg; }),
                avg_anomaly: d3.mean(values, function(d) {return d.anomaly; })
            };
        }
    }

    function rollingOne(first_key, datas) {
        return d3.nest()
            .key(function(d) { return d[first_key]; })
            .rollup(stats())
            .entries(datas);
    }

    function rollingTwo(first_key, second_key, datas) {
        return d3.nest()
            .key(function(d) { return d[first_key]; })
            .key(function(d) { return d[second_key]; })
            .rollup(stats())
            .entries(datas);
    }

    function rollingThree(first_key, second_key, third_key, datas) {
        return d3.nest()
            .key(function(d) { return d[first_key]; })
            .key(function(d) { return d[second_key]; })
            .key(function(d) { return d[third_key]; })
            .rollup(stats())
            .entries(datas);
    }

    function rollingFour(first_key, second_key, third_key, fourth_key, datas) {
        return d3.nest()
            .key(function(d) { return d[first_key]; })
            .key(function(d) { return d[second_key]; })
            .key(function(d) { return d[third_key]; })
            .key(function(d) { return d[fourth_key]; })
            .rollup(stats())
            .entries(datas);
    }
});