#!/bin/bash

PIDS=$(ps aux|grep TSW|gawk '$0 !~/grep/ {print $2}' |tr -s '\n' ','|sed 's/,$/\n/')

if [ "$PIDS" ]
then
	echo "pids:$PIDS"
	top -c -p $PIDS
else
	echo "do nothing, there is no pids"
fi