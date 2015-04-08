var fs = require('fs');

if (fs.existsSync(process.env.PWD + '/tiapp.xml') === false) {
	process.stderr.write("\x1b[31;1m Not a valid Titanium project \x1b[0m\n");
	process.exit(1);
}

if (fs.existsSync(process.env.PWD + '/app') === false) {
	process.stderr.write("\x1b[31;1m Not a valid Alloy project \x1b[0m\n");
	process.exit(1);
}