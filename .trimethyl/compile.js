var fs = require('fs');
var map = require('./map.json');

// Get the configuration
var config = {};
if (fs.existsSync(process.env.PWD+'/trimethyl.json')) {
	config = require(process.env.PWD+'/trimethyl.json');
	if (config == null) {
		process.stderr.write("\x1b[31;1m Unable to read trimethyl.json file \x1b[0m\n");
		process.exit(1);
	}

} else {
	config.libs = Object.keys(map);
	process.stdout.write("\x1b[31;1m Unable to find trimethyl.json file, all libraries will be included! \x1b[0m\n");

}

// Get the libraries to copy in /Resources
var libs = {};
function buildDependencies(key) {
	if (map[key] == null) return;
	if (key in libs) return;

	libs[key] = true;
	if (map[key].dependencies != null) {
		map[key].dependencies.forEach(buildDependencies);
	}
}
(config.libs || []).forEach(buildDependencies);
libs = Object.keys(libs);

// Actually copy files

var dirT = process.env.PWD + '/Resources/iphone/T';
if ( ! fs.existsSync(dirT)) {
	fs.mkdirSync(dirT);
}

libs.forEach(function(name) {
	console.log('Copying Trimethyl module "' + name + '"');

	if (/\//.test(name)) {
		if ( ! fs.existsSync(dirT + '/' + name.split('/')[0])) {
			fs.mkdirSync(dirT + '/' + name.split('/')[0]);
		}
	}

	if ( ! fs.existsSync(dirT + '/' + name + '.js')) {
		fs.createReadStream('./' + name + '.js').pipe(fs.createWriteStream(dirT + '/' + name + '.js'));
	}
});