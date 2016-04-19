#!/bin/sh

rm -rf /tmp/trimethyl-docset; mkdir -p /tmp/trimethyl-docset
rm -rf /tmp/trimethyl-wiki; mkdir -p /tmp/trimethyl-wiki

cp -R guides /tmp/trimethyl-wiki &&
jsdoc -c jsdoc.conf.json -d /tmp/trimethyl-docset &&
jsdoc -c jsdoc.conf.json -d docset -p -t node_modules/jsdoc-dash-template &&

cd /tmp/trimethyl-docset &&
git init && git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.git &&
git push -u -f origin gh-pages &&

cd /tmp/trimethyl-wiki &&
git init &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.wiki.git &&
git push -u -f origin master