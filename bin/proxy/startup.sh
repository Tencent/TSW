#!/bin/bash

echo "startup"

#export LANG="zh_CN.UTF-8"

CUR_DIR=$(cd $(dirname $0); pwd)

cd ${CUR_DIR}/
pwd

if [ -f "${CUR_DIR}/../tencent/so.sh" ]
then
	${CUR_DIR}/../tencent/so.sh
else
    ${CUR_DIR}/../proxy/so.sh
fi

echo "start"
PIDS=$(ps -fC TSW|grep TSW|gawk '$0 !~/grep/ {print $2}' |tr -s '\n' ' ')

if [ "$PIDS" ]
then
	echo "do nothing, pids exists: $PIDS"
	echo "exit"
	exit 0
else
	echo "do nothing, there is no pids"
fi

cd ${CUR_DIR}/../
pwd
./TSW --expose_internals ./proxy >> ../log/run.log.0 2>&1 &

echo start done

