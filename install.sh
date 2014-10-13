#!/bin/sh

cd ../..

if [ ! -f "tiapp.xml" ]; then
	echo "This is not a valid Titanium project"
	exit 1
fi

if [ ! -d "app" ]; then
	echo "This is not a valid Alloy project"
	exit 1
fi

mkdir -p app/lib
ln -s ../../node_modules/trimethyl app/lib/T

ln -s T/alloy app/lib/alloy