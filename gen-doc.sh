#!/bin/sh

rm -rf /tmp/trimethyl
mkdir -p /tmp/trimethyl

node -e "
var fs = require('fs');
fs.writeFileSync('jsduck-guides.json', JSON.stringify([{
	title: 'Trimethyl Guide',
	items: fs.readdirSync('guides').map(function(e) {
		return {
			name: e,
			title: e.substr(0,1).toUpperCase() + e.substr(1).replace('.md', '')
		};
	})
}]));
"

jsduck --config jsduck.json
open /tmp/trimethyl/index.html

cd /tmp/trimethyl &&
git init &&
git checkout -b gh-pages &&
git add -A &&
git commit -am "Documentation of $(date)" &&
git remote add origin git@github.com:CaffeinaLab/Trimethyl.git &&
git push -u -f origin gh-pages
