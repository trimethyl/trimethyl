#!/bin/sh

rm -rf /tmp/trimethyl
mkdir -p /tmp/trimethyl
rm -rf /tmp/trimethyl.wiki
mkdir -p /tmp/trimethyl.wiki

node gendoc.js &&
jsduck --config jsduck.json &&

cd /tmp/trimethyl &&
git init &&
git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.git &&
git push -u -f origin gh-pages

cd /tmp/trimethyl.wiki &&
git init &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.wiki.git &&
git push -u -f origin master