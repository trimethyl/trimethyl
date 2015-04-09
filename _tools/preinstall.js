var fs = require('fs');
var path = require('path');

var CWD = path.dirname(path.dirname(process.cwd()));

if (fs.existsSync(CWD + '/tiapp.xml') === false) {
	process.stderr.write("\x1b[31;1mNot a valid Titanium project\x1b[0m\n");
	process.exit(1);
}

if (fs.existsSync(CWD + '/app/alloy.js') === false) {
	process.stderr.write("\x1b[31;1mNot a valid Alloy project\x1b[0m\n");
	process.exit(1);
}