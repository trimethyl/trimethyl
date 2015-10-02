#!/bin/sh

rm -rf /tmp/trimethyl
mkdir -p /tmp/trimethyl

jsduck framework --output /tmp/trimethyl --title "Trimethyl API Documentation" --footer "Alloy+Titanium toolchain with superpowers" --exclude framework/ext &&

cd /tmp/trimethyl &&

git init && git checkout -b gh-pages &&
git add -A && git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.git &&
git push -u -f origin gh-pages
