var fs = require('fs');
var d3 = require('d3');
var _ = require('lodash');
var R = require('ramda');
var stringify = require('csv-stringify');

fs.readFile('all.csv', 'utf8', function(e, snow_levels) {
    var data = d3.csv.parse(snow_levels);

    var el_year = rollingTwo('elevation', 'year', data);
    var state_year_month = rollingThree('state', 'year', 'month', data);
    var el_year_month  = rollingThree('elevation', 'year', 'month', data);
    var state_el_year  = rollingThree('state', 'elevation', 'year', data);
    var state_el_year_month  = rollingFour('state', 'elevation', 'year', 'month', data);

    var year_month_flat = flattenTwo(el_year);
    var state_year_month_flat = flattenThree(state_year_month, 'state');
    var el_year_month_flat  = flattenThree(el_year_month, 'elevation');
    var state_el_year_flat = flattenThreePlus(state_el_year);
    var state_el_year_month_flat  = flattenFour(rollingFour('state', 'elevation', 'year', 'month', data));

    var year_month_range = ranges(el_year, 2);
    var state_year_month_range = ranges(state_year_month, 3);
    var el_year_month_range = ranges(el_year_month, 3);
    var state_el_year_range = ranges(state_el_year, 3);
    var state_el_year_month_range = ranges(state_el_year_month, 4);

    var types = [el_year, state_year_month, el_year_month, state_el_year, state_el_year_month];

    types.forEach(function(file, i) {
        fs.writeFile('web_files/grouped_' + i + '.json', JSON.stringify(file, null), function(err) {
            console.log(err)
        });
    });

    var types_flat = [year_month_flat, state_year_month_flat, el_year_month_flat, state_el_year_flat, state_el_year_month_flat];
    var options = {header: true,
        columns: [ 'state', 'year', 'month', 'elev', 'avg_anomaly', 'median_anomaly', 'temp_mean', 'snow_mean', 'snow_median', 'site_count']
    };

    types_flat.forEach(function(file, i) {
        stringify(file, options, function(e, output){
            fs.writeFile('web_files/grouped_' + i + '.csv', output, function(err) {
                console.log(err)
            });
        });
    });

    var rangeList = {
        year_range_month: year_month_range,
        state_year_month_range: state_year_month_range,
        el_year_month_range: el_year_month_range,
        stae_el_year_range: state_el_year_range,
        state_el_year_month_range: state_el_year_month_range
    };

    fs.writeFile('web_files/grouped_ranges.json', JSON.stringify(rangeList, null), function(err) {
        console.log(err)
    });
});

function stats() {
    var text_format = d3.format(".01f");

    return function(values) {
        return {
            total: _.uniq(values, function(d) { return d.site_id; }).length,
            snow_mean: text_format(d3.mean(values, function(d) {return +d.swe; })),
            snow_median: text_format(d3.median(values, function(d) {return+ d.swe; })),
            temp_mean: text_format(d3.mean(values, function(d) {return +d.temp_avg; })),
            avg_anomaly: text_format(d3.mean(values, function(d) {return +d.avg_anomaly; })),
            median_anomaly: text_format(d3.median(values, function(d) {return +d.median_anomaly; }))
        };
    }
}

function ranges(data, depth) {
    var totals = [];

    data.forEach(function(d) {
        d.values.forEach(function(e) {
            if(depth > 2) {
                e.values.forEach(function(g) {
                    if(depth === 3) {
                        totals.push(g.values);
                    } else {
                        g.values.forEach(function(h) {
                            totals.push(h.values);
                        });
                    }
                });
            } else {
                totals.push(e.values);
            }
        });
    });

    var snow_mean = d3.extent(totals, function(d) {  return +d.snow_mean; });
    var snow_median = d3.extent(totals, function(d) { return +d.snow_median; });
    var temp_mean = d3.extent(totals, function(d) { return +d.temp_mean; });
    var avg_anomaly = d3.extent(totals, function(d) { return +d.avg_anomaly; });
    var median_anomaly = d3.extent(totals, function(d) { return +d.median_anomaly; });

    return {
        snow_mean: snow_mean,
        snow_median: snow_median,
        temp_mean: temp_mean,
        avg_anomaly: avg_anomaly,
        median_anomaly: median_anomaly
    };
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

function flattenTwo(nested_group) {
    var flat = [];

    nested_group.forEach(function(d) {
        d.values.forEach(function(e) {
            flat.push({
                state: '',
                year: e.key,
                month: '',
                elev: d.key,
                avg_anomaly: e.values.avg_anomaly,
                median_anomaly: e.values.median_anomaly,
                temp_mean: e.values.temp_mean,
                snow_mean: e.values.snow_mean,
                snow_median: e.values.snow_median,
                site_count: e.values.total
            });
        });
    });

    return flat;
}

function flattenThree(nested_group, type) {
    var flat = [];

    nested_group.forEach(function(d) {
        var el_key = (type === 'elevation') ? d.key * 1000 : '';
        var state_key = (type === 'state') ? d.key : '';

        d.values.forEach(function(e) {
            e.values.forEach(function(f) {
                flat.push({
                    state: state_key,
                    year: e.key,
                    month: f.key,
                    elev: el_key,
                    avg_anomaly: f.values.avg_anomaly,
                    median_anomaly: f.values.median_anomaly,
                    temp_mean: f.values.temp_mean,
                    snow_mean: f.values.snow_mean,
                    snow_median: f.values.snow_median,
                    site_count: f.values.total
                });
            });
        });
    });

    return flat;
}

function flattenThreePlus(nested_group) {
    var flat = [];

    nested_group.forEach(function(d) {
        d.values.forEach(function(e) {
            e.values.forEach(function(f) {
                flat.push({
                    state: d.key,
                    year: f.key,
                    month: '',
                    elev: e.key,
                    avg_anomaly: f.values.avg_anomaly,
                    median_anomaly: f.values.median_anomaly,
                    temp_mean: f.values.temp_mean,
                    snow_mean: f.values.snow_mean,
                    snow_median: f.values.snow_median,
                    site_count: f.values.total
                });
            });
        });
    });

    return flat;
}

function flattenFour(nested_group) {
    var flat = [];

    nested_group.forEach(function(d) {
        d.values.forEach(function(e) {
            e.values.forEach(function(f) {
                f.values.forEach(function(g) {
                    flat.push({
                        state: d.key,
                        year: f.key,
                        month: g.key,
                        elev: e.key,
                        avg_anomaly: g.values.avg_anomaly,
                        median_anomaly: g.values.median_anomaly,
                        temp_mean: g.values.temp_mean,
                        snow_mean: g.values.snow_mean,
                        snow_median: g.values.snow_median,
                        site_count: g.values.total
                    });
                });
            });
        });
    });

    return flat;
}