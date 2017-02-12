<?php
$processed_files = scandir("processed_data");
$ft = fopen("all.csv", "wb");
fputcsv($ft, ["swe", "temp_avg", "year", "month", "day", "state", "elevation", "station_id", "avg", "avg_anomaly","median", "median_anomaly", "found"]);

foreach($processed_files as $file) {
    if(is_dir($file)) continue;

    if (($handle = fopen("final_data/" . $file, "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if(preg_match("/^\d/", $data[0])) {
                fputcsv($ft, $data);
            }
        }
        fclose($handle);
    }

    echo $file . " processed\n";
}

fclose($ft);