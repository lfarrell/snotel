var fs = require('fs');
var d3 = require('d3');
var _ = require('lodash');
var R = require('ramda');
var stringify = require('csv-stringify');

var base = 'processed_data';
var text_format = d3.format(".01f");

fs.readFile('raw_avgs/1981-2010_SWE_Averages.csv', 'utf8', function(e, snow_avgs) {
    fs.readFile('raw_avgs/1981-2010_SWE_Medians.csv', 'utf8', function(e, snow_medians) {
        var avgs = d3.csv.parse(snow_avgs);
        var medians = d3.csv.parse(snow_medians);

        fs.readdir(base, function(err, files) {
            files.forEach(function(file) {
                if(/csv$/.test(file)) {
                    fs.readFile(base + '/' + file, 'utf8', function(e, rows) {
                        var data = d3.csv.parse(rows);
                        var short_month;

                        var day_totals = d3.nest()
                            .key(function(d) { return d.month; })
                            .key(function(d) { return d.day; })
                            .rollup(stats())
                            .entries(data);

                        data.forEach(function(d) {
                            if(d.month.substr(0, 1) == '0') {
                                short_month = d.month.substr(1);
                            } else {
                                short_month = d.month;
                            }
                            var day = short_month + d.day;
                            console.log(day)
                            var avg_row = _.find(avgs, function(e) {
                                return d.station_id == e.snotel_id;
                            });

                            var month_data = _.find(day_totals, {key: d.month});
                            var days_data = _.findWhere(month_data.values, {key: d.day});

                            var median_row = _.find(medians, function(e) {
                                return d.station_id == e.snotel_id;
                            });

                            if(avg_row !== undefined) {
                                d.avg = text_format(avg_row[day]);
                                d.avg_anomaly = text_format(d.swe - d.avg);
                            } else {
                                d.avg = text_format(days_data.values.temp_mean);
                                d.avg_anomaly = text_format(d.swe - d.avg);
                            }

                            if(median_row !== undefined) {
                                d.median = text_format(median_row[day]);
                                d.median_anomaly = text_format(d.swe - d.median);
                            } else {
                                d.median = text_format(days_data.values.temp_median);
                                d.median_anomaly = text_format(d.swe - d.median);
                            }

                            d.found = (avg_row === undefined) ? 0 : 1;
                        });

                        var options = {header: true,
                            columns: ['swe', 'temp_avg', 'year', 'month', 'day', 'state', 'elevation', 'station_id', 'avg', 'avg_anomaly','median', 'median_anomaly', 'found']
                        };

                        stringify(data, options, function(e, output) {
                            fs.writeFile('final_data/' + file, output, function(err) {
                                console.log(err)
                            });
                        });
                    });
                }
            });
        });
    });
});

function stats() {
    return function(values) {
        return {
            temp_mean: d3.mean(values, function(d) {return d.temp_avg; }),
            temp_median: d3.median(values, function(d) {return d.temp_avg; })
        };
    }
}