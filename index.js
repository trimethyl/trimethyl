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

function readMap() {
	return require('./map.json');
}

/**
 * @method install
 * Copy the modules
 */
exports.install = function() {
	var map = readMap();

	// Get the configuration
	var config = readConfig();
	if (_.isEmpty(config.libs)) {
		config.libs = Object.keys(map);
	}

	// Get the libraries to copy in /Resources
	var libs = {
		"trimethyl" : {
			"name": "Trimethyl",
			"description": "Base bootstrap framework file."
		}
	};

	function buildDependencies(key, req, tabs) {
		req = req || null;
		tabs = tabs || 0;
		if (key in libs) return;

		var val = map[key];
		libs[key] = _.extend({}, val, {
			requiredBy: req,
			tabs: tabs
		});
		(val.dependencies || []).forEach(function(o) {
			buildDependencies(o, val, tabs+1);
		});
	}
	(config.libs || []).forEach(function(v) {
		buildDependencies(v);
	});

	var R = CWD + '/app/lib';
	if (fs.existsSync(R) === false) fs.mkdirSync(R);
	fs.deleteDirSync(R + '/T');

	// Copy libs!!
	_.each(libs, function(info, key) {
		var tabs = info.tabs ? new Array(Math.max(0,(info.tabs||0)-1)*4).join(' ') + '|' + new Array(3).join('-') : '';
		logger.info(tabs + 'Installing ' + info.name);

		var srcFile, dstFile;

		if (/^alloy\//.test(key)) {
			key = key.replace('alloy/', '');
			dstFile = R + '/alloy/' + key + '.js';
			srcFile = __dirname + '/framework/alloy/' + key + '.js';
		} else {
			dstFile = R + '/T/' + key + '.js';
			srcFile = __dirname + '/framework/' + key + '.js';
		}

		fs.createDirSync(path.dirname(dstFile));
		fs.copyFileSync(srcFile, dstFile);
	});

	// Write version
	config.version = require('package.json').version;
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));
	logger.info('trimethyl.json file written successfully');
};

/**
 * @method add
 * Add a module to the app
 */
exports.add = function(value) {
	var map = readMap();
	if (!(value in map)) {
		logger.error('Module <' + value + '> is not a valid Trimethyl module.');
		process.exit();
	}

	var config = readConfig();
	config.libs.push(value);
	config.libs = _.uniq(config.libs);

	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));
	logger.info('trimethyl.json file written successfully');

	return true;
};

/**
 * @method remove
 * Remove a module to the app
 */
exports.remove = function(value) {
	var config = readConfig();
	var io = config.libs.indexOf(value);

	if (io === -1) {
		logger.warn('Unable to find <' + value + '> in your libs');
		return;
	}

	config.libs.splice(io, 1);

	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));
	logger.info('trimethyl.json file written successfully');

	return true;
};