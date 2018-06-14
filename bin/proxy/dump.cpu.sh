#!/bin/bash

echo "begin profiler"

curl "127.0.0.1:12701/profiler?time=$1"


