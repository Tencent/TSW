#!/bin/bash

CUR_DIR=$(cd $(dirname $0); pwd) 

echo "begin exec restart"

${CUR_DIR}/shutdown.sh


${CUR_DIR}/startup.sh