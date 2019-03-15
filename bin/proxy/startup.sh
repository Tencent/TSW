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
	echo "there is no pids of TSW"
fi

CUR_ARGS=""

if [ -f "/etc/node_args.ini" ]
then
	CUR_ARGS=$(head -1 /etc/node_args.ini)
else
    echo "do nothing, node_args.ini ignore"
fi

echo "args: $CUR_ARGS"

cd ${CUR_DIR}/../
pwd

IS_DOCKER=${IS_DOCKER:=0}
if [ ${IS_DOCKER} = 1 ]
then
    ./TSW --expose_internals --no-deprecation $CUR_ARGS ./proxy
else
    ./TSW --expose_internals --no-deprecation $CUR_ARGS ./proxy >> ../log/run.log.0 2>&1 &
    sleep 0.5s
    echo "sleep 0.5s"

    echo "ps -fC TSW"
    ps -fC TSW
    echo start down
fi

