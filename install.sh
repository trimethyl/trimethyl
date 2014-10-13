#!/bin/sh

if [ ! -f "tiapp.xml" ]; then
	echo "Not a valid Titanium project"
	exit
fi

if [ ! -d "app" ]; then
	echo "Not a valid Alloy project"
	exit
fi

mkdir -p app/lib
ln -s ../../node_modules/trimethyl app/lib/T

ln -s T/alloy app/lib/alloy