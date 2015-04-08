var fs = require('fs');
var path = require('path');

var __DIR__ = path.dirname(path.dirname(process.cwd()));

if (fs.existsSync(path.join(__DIR__, 'tiapp.xml')) === false) {
	process.stderr.write(" \x1b[31;1m Not a valid Titanium project \x1b[0m \n");
	process.exit(1);
}

if (fs.existsSync(path.join(__DIR__, 'app')) === false) {
	process.stderr.write(" \x1b[31;1m Not a valid Alloy project \x1b[0m \n");
	process.exit(1);
}

// remove any existing Trimethyl 2 installation
fs.unlinkSync(path.join(__DIR__, 'app', 'lib', 'T'));

// TODO: install the hook
require('./hook.js');