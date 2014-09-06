#!/bin/sh
if [ -f tiapp.xml ]; then
	wget https://github.com/CaffeinaLab/Trimethyl/archive/1.2.3.tar.gz -O T.tar.gz
	mkdir -p app/lib/T
	tar -xvf T.tar.gz -C app/lib/T --strip-components=1
	ln -s ../../../lib/T/assets app/assets/iphone/images/T
	ln -s T/alloy app/lib/alloy
else; echo "Please move to your Titanium project to install Trimethyl"; fi
