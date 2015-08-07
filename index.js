var fs = require('fs-extended');
var path = require('path');
var _ = require('underscore');
var logger = require('./lib/logger');

var CWD = process.cwd();

var __tiapp = null;
function readTiApp(callback) {
	if (__tiapp != null) {
		callback(__tiapp);
		return;
	}

	(new require('xml2js')).Parser().parseString( fs.readFileSync( CWD + '/tiapp.xml' ), function(err, data) {
		if (err) {
			logger.error("Unable to parse tiapp.xml");
			process.exit(1);
		}

		__tiapp = data;
		callback(__tiapp);
	});
}

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

var __map = null;
function getMap() {
	__map = __map || require('./map.json');
	return __map;
}

function buildDependencies(libs, key, req, tabs) {
	req = req || null;
	tabs = tabs || 0;
	if (key in libs) return;

	var dst_file, src_file;

	if (/^alloy\//.test(key)) {
		dst_file = CWD + '/app/lib' + '/alloy/' + key.replace('alloy/', '') + '.js';
		src_file = __dirname + '/framework/alloy/' + key.replace('alloy/', '') + '.js';
	} else {
		dst_file = CWD + '/app/lib' + '/T/' + key + '.js';
		src_file = __dirname + '/framework/' + key + '.js';
	}

	var val = getMap()[key];
	if (val == null) {
		logger.error('Unable to find module "' + key + '"');
		return;
	}

	libs[key] = _.extend({}, val, {
		requiredBy: req,
		tabs: tabs,
		dst_file: dst_file,
		src_file: src_file,
		size: (fs.statSync(src_file).size / 1000).toFixed(2) + "KB"
	});
	(val.dependencies || []).forEach(function(o) {
		buildDependencies(libs, o, val, tabs+1);
	});
}

function compareVersions(a, b) {
	if (a == null || b == null) return 0;

	a = a.split('.');
	b = b.split('.');
	for (var i = 0; i < Math.max(a.length, b.length); i++) {
		var _a = +a[i] || 0, _b = +b[i] || 0;
		if (_a > _b) return 1;
		else if (_a < _b) return -1;
	}
	return 0;
}

function checkNativeModule(name) {

}

/**
 * @method install
 * Copy the modules
 */
exports.install = function() {
	var current_version = require('./package.json').version;

	// Get the configuration
	var config = readConfig();

	if (compareVersions(config.version, current_version) === 1) {
		logger.warn("You are doing a downgrade from " + config.version + ' to ' + current_version);
	}

	if (_.isEmpty(config.libs)) {
		// If a configuration is missing, copy all libs
		config.libs = Object.keys(getMap());
		logger.warn('Configuration missing, all libraries will be copied');
	}

	// Get the libraries to copy in /Resources
	var libs_to_copy = {};

	// Build deps
	(["trimethyl"].concat( config.libs )).forEach(function(v) {
		buildDependencies(libs_to_copy, v);
	});

	// Ensure path extistence
	if ( ! fs.existsSync(CWD + '/app/lib')) fs.mkdirSync(CWD + '/app/lib');
	fs.deleteDirSync(CWD + '/app/lib/T');
	fs.mkdirSync(CWD + '/app/lib/T');

	// Copy libs!!
	_.each(libs_to_copy, function(info, key) {
		var tabs = info.tabs ? new Array(Math.max(0,(info.tabs||0)-1)*4).join(' ') + '└' + new Array(3).join('─') : '';
		logger.debug(tabs + 'Installing ' + info.name + ' (' + info.size + ')');

		var dir_name = path.dirname(info.dst_file);
		if ( ! fs.existsSync(dir_name)) fs.createDirSync(dir_name);

		fs.copyFileSync(info.src_file, info.dst_file);
	});

	// Add utils
	config.version = current_version;
	config.install_date = Date.now();

	// Write version
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(config));

	logger.info('Version installed: ' + config.version);
};

/**
 * @method add
 * Add a module to the app
 */
exports.add = function(value) {
	value = value.replace('.', '/');

	if (!(value in getMap())) {
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
	value = value.replace('.', '/');

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