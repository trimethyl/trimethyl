var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var guides = fs.readdirSync('guides').filter(function(file) {
	return fs.statSync(path.join('guides', file)).isDirectory();
});

fs.writeFileSync('jsduck-guides.json', JSON.stringify([{
	title: 'Trimethyl Guide',
	items: guides.map(function(e) {
		return {
			name: e,
			title: e
		};
	})
}]));

guides.forEach(function(e) {
	child_process.execSync('cp "guides/' + e + '/README.md" "/tmp/trimethyl.wiki/' + e + '.md"');
});