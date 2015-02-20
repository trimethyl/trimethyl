var fs = require('fs');
var path = require('path');

var base = path.dirname(path.dirname(process.cwd()));

if (!fs.existsSync(path.join(base, 'tiapp.xml'))) {
	process.stderr.write(" \x1b[31;1m Not a valid Titanium project \x1b[0m \n");
	process.exit(1);
}

if (!fs.existsSync(path.join(base, 'app'))) {
	process.stderr.write(" \x1b[31;1m Not a valid Titanium project \x1b[0m \n");
	process.exit(1);
}

if (!fs.existsSync(path.join(base, 'app', 'lib'))) {
	fs.mkdirSync(path.join(base, 'app', 'lib'));
}

fs.symlinkSync('../../node_modules/trimethyl', path.join(base, 'app', 'lib', 'T'));