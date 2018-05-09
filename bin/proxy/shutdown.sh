#!/bin/bash

CUR_DIR=$(cd $(dirname $0); pwd)

echo "shutdown begin"

${CUR_DIR}/kill.sh

echo "shutdown end"