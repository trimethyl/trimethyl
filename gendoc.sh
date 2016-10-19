#!/bin/sh

rm -rf /tmp/trimethyl-docset; mkdir -p /tmp/trimethyl-docset
rm -rf /tmp/trimethyl-wiki; mkdir -p /tmp/trimethyl-wiki

jsdoc -c jsdoc.conf.json -d /tmp/trimethyl-docset &&

jsdoc -c jsdoc.conf.json -d docset -p -t node_modules/jsdoc-dash-template &&
tar -cvzf docset/Trimethyl.tgz docset/Trimethyl.docset &&
rm -rf docset/Trimethyl.docset &&
echo "<entry><version>$(./version.sh)</version><url>https://github.com/trimethyl/trimethyl/raw/master/docset/Trimethyl.tgz?raw=1</url></entry>" > docset/Trimethyl.xml &&

cd /tmp/trimethyl-gh-pages &&
git init && git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:trimethyl/trimethyl.git &&
git push -u -f origin gh-pages