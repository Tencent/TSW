#!/bin/bash


CUR_DIR=$(cd $(dirname $0); pwd) 

cd ${CUR_DIR}/../
pwd

echo "strat kill"


echo "ps -fC TSW"
ps -fC TSW

PIDS=$(ps -fC TSW|grep TSW|grep /proxy|gawk '$0 !~/grep/ {print $2}' |tr -s '\n' ' ')

if [ "$PIDS" ]
then
	echo "kill -9 $PIDS"
	kill -9 $PIDS
else
	echo "do nothing, there is no pids"
fi

PIDS=$(ps aux|grep TSW/worker|gawk '$0 !~/grep/ {print $2}' |tr -s '\n' ' ')

if [ "$PIDS" ]
then
	echo "kill -9 $PIDS"
	kill -9 $PIDS
else
	echo "do nothing, there is no pids"
fi

sleep 0.5s
echo "sleep 0.5s"

echo "ps -fC TSW"
ps -fC TSW

