var fs = require('fs');
var path = require('path');

exports.compile = function(event, logger) {
	logger.info();
	logger.info('----- TRYMETHYL INSTALLATION -----');

	var map = require('./map.json');

	// Get the configuration
	var config = {};
	if (fs.existsSync(process.env.PWD + '/trimethyl.json')) {
		try {
			config = require(process.env.PWD + '/trimethyl.json');
		} catch (err) {
			config.libs = Object.keys(map);
			logger.error("Unable to read trimethyl.json file, all libraries will be included!");
		}
	} else {
		config.libs = Object.keys(map);
		logger.warn("Unable to find trimethyl.json file, all libraries will be included!");
	}

	// Get the libraries to copy in /Resources
	var libs = { "trimethyl":true };
	function buildDependencies(key) {
		if (map[key] == null) return;
		if (libs[key] === true) return;

		libs[key] = true;
		if (map[key].dependencies != null) {
			map[key].dependencies.forEach(buildDependencies);
		}
	}
	(config.libs || []).forEach(buildDependencies);
	libs = Object.keys(libs);


	// Create /T directory
	if (fs.existsSync(event.dir.resources + '/T') === false) {
		fs.mkdirSync(event.dir.resources + '/T');
	}

	// Copy libs!!
	libs.forEach(function(name) {
		logger.info('Installing Trimethyl.' + name.substr(0,1).toUpperCase() + name.substr(1) + '...');
		var dstFile, srcFile;

		if (/^alloy\//.test(name)) {
			name = name.replace('alloy/', '');
			dstFile = event.dir.resources + '/alloy/' + name + '.js';
			srcFile = path.dirname(__dirname) + '/alloy/' + name + '.js';
		} else {
			dstFile = event.dir.resources + '/T/' + name + '.js';
			srcFile = path.dirname(__dirname) + '/' + name + '.js';
		}

		var nsplit = name.split('/');
		if (nsplit.length >= 1 && fs.existsSync(path.dirname(dstFile)) === false) {
			fs.mkdirSync(path.dirname(dstFile));
		}

		if (fs.existsSync(dstFile) === false) {
			fs.createReadStream(srcFile).pipe(fs.createWriteStream(dstFile));
		}
	});

	logger.info();

};