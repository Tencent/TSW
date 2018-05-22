#!/bin/bash

CUR_DIR=$(cd $(dirname $0); pwd)

cd ${CUR_DIR}/

pwd

rm -rf *.top100*

echo "begin top100"

curl 127.0.0.1:12701/top100

tail -f ../../log/run.log.0 |grep top




