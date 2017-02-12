#!/bin/bash

echo "Processing raw data"
php process.php

echo "Adding row averages and medians"
node add_avg.js

echo "Merging all files"
php merge_all.php

echo "Grouping data"
node munge.js