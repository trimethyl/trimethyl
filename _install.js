var fs = require('fs');
var path = require('path');

var base = path.dirname(path.dirname(process.cwd()));

if (!fs.existsSync(path.join(base, 'tiapp.xml'))) {
	process.stderr.write("Not a valid Titanium project\n");
	process.exit(1);
}

if (!fs.existsSync(path.join(base, 'app'))) {
	process.stderr.write("Not a valid Alloy project\n");
	process.exit(1);
}

if (!fs.existsSync(path.join(base, 'app', 'lib'))) {
	fs.mkdirSync(path.join(base, 'app', 'lib'));
}

fs.symlinkSync('../../node_modules/trimethyl', path.join(base, 'app', 'lib', 'T'));