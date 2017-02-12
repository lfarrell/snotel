<?php
$files = scandir("raw_data");
$elevation = "";
$headers = ["swe", "temp_avg", "year", "month", "day", "state", "elevation", "station_id"];

foreach($files as $file) {
    if(is_dir($file)) continue;

    $file_parts = preg_split("/_/", $file);
    $station_id = preg_split("/\./", $file_parts[1])[0];

    $fh = fopen("processed_data/" . $file, "wb");
    fputcsv($fh, $headers);

    if (($handle = fopen("raw_data/" . $file, "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {

            if(preg_match("/SNOTEL.Site.*?ft/", $data[0], $matches)) {
                $el = trim(preg_replace("/ft/", "", (preg_split("/-/", $matches[0])[1])));
                $elevation = (strlen($el) == 4) ? substr($el, 0, 1) : 10;
            }

            if(preg_match("/^\d/", $data[0])) {
                $year_parts = preg_split("/-/", $data[0]);
                $year = $year_parts[0];
                $month = $year_parts[1];
                $day = $year_parts[2];

                $state = $file_parts[0];

                if($year >= 2000 && $year < 2017 && $month < 7 && $data[1] != ""
                    && ceil($data[1]) > 0 && $data[5] != "" && $data[5] < 100) {

                    if($state == "OR" && $elevation == 10) continue;
                    fputcsv($fh, [trim($data[1]), trim($data[5]), $year, $month, $day, $state, $elevation, $station_id]);

                }
            }
        }
        fclose($handle);
    }
    fclose($fh);

    echo $file . " processed\n";
}