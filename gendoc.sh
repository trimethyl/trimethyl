#!/bin/sh

rm -rf /tmp/trimethyl-docset; mkdir -p /tmp/trimethyl-docset
rm -rf /tmp/trimethyl-wiki; mkdir -p /tmp/trimethyl-wiki

cp -R guides /tmp/trimethyl-wiki &&

jsdoc -c jsdoc.conf.json -d /tmp/trimethyl-docset &&

jsdoc -c jsdoc.conf.json -d docset -p -t node_modules/jsdoc-dash-template &&
tar --exclude='.DS_Store' -cvzf docset/Trimethyl.tgz docset/Trimethyl.docset &&
rm -rf docset/Trimethyl.docset &&
echo "<entry><version>$(./version.sh)</version><url>https://github.com/caffeinalab/trimethyl/raw/master/docset/Trimethyl.tgz?raw=1</url></entry>" > docset/Trimethyl.xml &&

git add -A && git commit -am "Documentation of $(date)" && git push &&

cd /tmp/trimethyl-docset &&
git init && git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:caffeinaLab/trimethyl.git &&
git push -u -f origin gh-pages &&

cd /tmp/trimethyl-wiki &&
git init &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:caffeinaLab/trimethyl.wiki.git &&
git push -u -f origin master