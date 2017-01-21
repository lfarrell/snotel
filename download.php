<?php
include "download.php";

foreach($stations as $station_name => $station_info) {
    $url = "https://wcc.sc.egov.usda.gov/reportGenerator/view_csv/customSingleStationReport/daily/" . $station_info['id'] . ":" . $station_info['state'] . ":SNTL|id=%22%22|name/POR_BEGIN,POR_END/WTEQ::value,PREC::value,TMAX::value,TMIN::value,TAVG::value,PRCP::value";
    $file_name = $station_info['state'] . "_" . $station_info['id'] . ".csv";

    $ch = curl_init($url);
    $fp = fopen("raw_data/$file_name", "wb");

    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

    curl_exec($ch);
    curl_close($ch);
    fclose($fp);

    echo $station_name . " processed\n";
}
//<.*?\d.*>\s