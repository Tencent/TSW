#!/bin/bash

echo

CUR_DIR=$(cd $(dirname $0); pwd)
LIBC_VERSION=$(ls -l /lib64/libc.so.6  | sed -e 's/.*libc-2.\(.*\).so/\1/g')

cd ${CUR_DIR}/../
pwd

BIN_DIR=$(pwd)

echo "BIN_DIR: ${BIN_DIR}"

echo "libc-2.${LIBC_VERSION}"

if [ -e "/usr/local/bin/node" ]
then
    echo "/usr/local/bin/node"
    ln -sf /usr/local/bin/node ./TSW
else
    echo "/usr/bin/node"
    ln -sf /usr/bin/node ./TSW
fi

chmod +x ./TSW

./TSW -v

echo "copy so done"

if [ -e "../log" ]
then
	echo "log exists"
else
	echo "mkdir log"
	mkdir ../log
	chmod -R 777 ../log
fi

if [ -e "../log/diff" ]
then
	echo "log/diff exists"
else
	echo "mkdir diff"
	mkdir ../log/diff
	chmod -R 777 ../log/diff
fi

if [ -e "../log/cache" ]
then
	echo "log/cache exists"
else
	echo "mkdir cache"
	mkdir ../log/cache
	chmod -R 777 ../log/cache
fi



