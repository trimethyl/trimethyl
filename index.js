var fs = require('fs-extended');
var path = require('path');
var _ = require('underscore');
var logger = require('./lib/logger');
var CWD = process.cwd();

function readConfig() {
	var config = {
		libs: []
	};
	if (fs.existsSync(CWD + '/trimethyl.json')) {
		try {
			config = require(CWD + '/trimethyl.json');
		} catch (err) {
			logger.error("Unable to parse trimethyl.json file!");
			process.exit(1);
		}
	}
	return config;
}

exports.install = function() {
	var map = require('./map.json');

	// Get the configuration
	var config = readConfig();

	// Get the libraries to copy in /Resources
	var libs = {
		"trimethyl" : {
			"name": "Trimethyl",
			"description": "Base bootstrap framework file."
		}
	};

	function buildDependencies(key) {
		if (map[key] == null) return;
		if (libs[key] != null) return;

		libs[key] = map[key];
		if (map[key].dependencies != null) {
			map[key].dependencies.forEach(buildDependencies);
		}
	}
	(config.libs || []).forEach(buildDependencies);

	var R = CWD + '/app/lib';
	if (fs.existsSync(R) === false) fs.mkdirSync(R);
	fs.deleteDirSync(R + '/T');

	// Copy libs!!
	_.each(libs, function(info, name) {
		logger.info('Installing ' + info.name);

		var srcFile, dstFile;

		if (/^alloy\//.test(name)) {
			name = name.replace('alloy/', '');
			dstFile = R + '/alloy/' + name + '.js';
			srcFile = __dirname + '/framework/alloy/' + name + '.js';
		} else {
			dstFile = R + '/T/' + name + '.js';
			srcFile = __dirname + '/framework/' + name + '.js';
		}

		fs.createDirSync(path.dirname(dstFile));
		fs.copyFileSync(srcFile, dstFile);
	});
};

exports.add = function(value) {
	var config = readConfig();
	config.libs.push(value);
	config.libs = _.uniq(config.libs);
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));
	logger.info('trimethyl.json file written successfully');
	return true;
};

exports.remove = function(value) {
	var config = readConfig();
	var io = config.libs.indexOf(value);
	if (io !== -1) {
		config.libs.splice(io, 1);
		fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));
		logger.info('trimethyl.json file written successfully');
		return true;
	} else {
		logger.warn('Unable to find <' + value + '> in your libs');
	}
};