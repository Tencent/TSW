#!/bin/bash

echo

CUR_DIR=$(cd $(dirname $0); pwd)

cd ${CUR_DIR}/../
pwd

BIN_DIR=$(pwd)

echo "BIN_DIR: ${BIN_DIR}"

NODE_PATH=$(node -p process.execPath)

if [ -e "${NODE_PATH}" ]
then
    echo "use node:${NODE_PATH}"
else
    echo "node cmd is not found"
    exit 1
fi

ln -sf $NODE_PATH ./TSW
chmod +x ./TSW

./TSW -v

if [ -e "../log" ]
then
	echo "log exists"
	chmod 777 ../log
else
	echo "mkdir log"
	mkdir ../log
	chmod 777 ../log
fi

if [ -e "../log/diff" ]
then
	echo "log/diff exists"
	chmod 777 ../log/diff
else
	echo "mkdir diff"
	mkdir ../log/diff
	chmod 777 ../log/diff
fi

if [ -e "../log/cache" ]
then
	echo "log/cache exists"
	chmod 777 ../log/cache
else
	echo "mkdir cache"
	mkdir ../log/cache
	chmod 777 ../log/cache
fi



