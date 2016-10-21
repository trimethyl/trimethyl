#!/bin/sh

# Prepare directores
rm -rf /tmp/trimethyl-gh-pages
mkdir -p /tmp/trimethyl-gh-pages
rm -rf /tmp/trimethyl-docset
mkdir -p /tmp/trimethyl-docset

# Generate gh-pages
jsdoc -c jsdoc.conf.json -d /tmp/trimethyl-gh-pages &&

# Generate docset for Kapeli Dash
jsdoc -c jsdoc.conf.json -d docset -p -t ./node_modules/jsdoc-dash-template &&
tar -cvzf ./docset/Trimethyl.tgz ./docset/Trimethyl.docset &&
rm -rf ./docset/Trimethyl.docset &&
echo "<entry><version>$(./version.sh)</version><url>https://github.com/trimethyl/trimethyl/raw/master/docset/Trimethyl.tgz?raw=1</url></entry>" > ./docset/Trimethyl.xml &&

# Commit the docset
git add ./docset/Trimethyl.tgz ./docset/Trimethyl.docset && 
git commit -am "Updated docset for version $(./version.sh)" && 
git push &&

# Move to gh-pages and push forced
cd /tmp/trimethyl-gh-pages &&
git init && git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:trimethyl/trimethyl.git &&
git push -u -f origin gh-pages