#!/usr/bin/env node
var fs = require('fs-extended');
var path = require('path');
var _ = require('underscore');
var program = require('commander');

var CWD = process.cwd();

var trimethyl_map = require('./map.json');
var package = require('./package.json');

var prompt = require('prompt');
prompt.message = '';
prompt.delimiter = '';
prompt.start();

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

	var val = trimethyl_map[key];
	if (val == null) {
		process.stdout.write(('Unable to find module "' + key + '"').red);
		process.exit();
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

/////////////////////////
// Configure commander //
/////////////////////////

program
.version(package.version, '-v, --version')
.description(package.description)
.usage('command <args> [options]');

////////////////////////////////
// Notify user of new version //
////////////////////////////////

var notifier = (require('update-notifier'))({ pkg: package });
if (notifier.update) {
	notifier.notify();
}

/////////////////////
// Install command //
/////////////////////

program.command('install').description('Install the framework files').action(function() {
	if (compareVersions(app_trimethyl_config.version, package.version) === 1) {
		process.stdout.write(("You are doing a downgrade from " + app_trimethyl_config.version + ' to ' + package.version + "\n").yellow);
	}

	if (_.isEmpty(app_trimethyl_config.libs)) {
		// If a configuration is missing, copy all libs
		app_trimethyl_config.libs = Object.keys(trimethyl_map);
		process.stdout.write('Configuration missing, all libraries will be copied\n'.yellow);
	}

	// Get the libraries to copy in /Resources
	var libs_to_copy = {};
	(["trimethyl"].concat( app_trimethyl_config.libs )).forEach(function(v) {
		buildDependencies(libs_to_copy, v);
	});
	libs_to_copy = _.toArray(libs_to_copy);

	// Ensure path extistence
	if (!fs.existsSync(CWD + '/app/lib')) fs.mkdirSync(CWD + '/app/lib');
	fs.deleteDirSync(CWD + '/app/lib/T');
	fs.mkdirSync(CWD + '/app/lib/T');

	// Star the chaining
	(function copyLibs(copy_libs_callback) {
		if (libs_to_copy.length === 0) {
			return copy_libs_callback();
		}

		var info = libs_to_copy.shift();
		var tabs = info.tabs ? new Array(Math.max(0,(info.tabs||0)-1)*4).join(' ') + '└' + new Array(3).join('─') : '';
		process.stdout.write(tabs + 'Installing ' + info.name + ' (' + info.size + ')\n');

		var dir_name = path.dirname(info.dst_file);
		if (!fs.existsSync(dir_name)) fs.createDirSync(dir_name);

		fs.copyFileSync(info.src_file, info.dst_file);

		(function installModules(install_modules_callback) {
			if (info.modules == null || info.modules.length === 0) {
				return install_modules_callback();
			}

			var module_def = info.modules.shift().split(':');
			var module = module_def[0];
			var platform = module_def[1];

			if (platform != 'commonjs' && !tiapp.getDeploymentTarget(platform)) {
				installModules(install_modules_callback);
				return;
			}

			if (null == _.find(tiapp.getModules(), function(m) {
				return m.id == module && m.platform == platform;
			})) {
				prompt.get({
					name: 'yesno',
					message: ("<" + info.name + "> requires the native module <" + module + "> for the platform <" + platform + ">. Install it?").yellow,
					validator: /y(es)?|n(o)?/,
					warning: 'Must respond yes or no',
					default: 'yes'
				}, function (err, result) {
					if (/y(es)?/i.test(result.yesno)) {
						require('child_process').exec('gittio install ' + module + ' -p ' + platform, function(error, stdout, stderr) {
							if (stderr) {
								process.stdout.write(stderr.replace(/\[.+?\] /g, '').red);
							} else {
								process.stdout.write(stderr.replace(/\[.+?\] /g, '').gray);
							}
							installModules(install_modules_callback);
						});
					} else {
						installModules(install_modules_callback);
					}
				});
			} else {
				installModules(install_modules_callback);
			}
		})(function() {
			copyLibs(copy_libs_callback);
		});

	})(function() {

		app_trimethyl_config.version = package.version;
		app_trimethyl_config.install_date = Date.now();

		fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(app_trimethyl_config));
		process.stdout.write(('Version installed: ' + app_trimethyl_config.version + '\n').green);

	});
});

//////////////////
// List command //
//////////////////

program.command('list').description('List all Trimethyl available modules').action(function() {
	_.each(trimethyl_map, function(m, k) {
		process.stdout.write(m.name + " ("+k+") - " + m.description + "\n");
	});
});

/////////////////
// Add command //
/////////////////

program.command('add [name]').description('Add a Trimethyl module to your config').action(function(name) {
	name = name.replace('.', '/');

	if (!(name in trimethyl_map)) {
		process.stdout.write(('<' + name + '> is not a valid Trimethyl module.').red);
		process.exit();
	}

	app_trimethyl_config.libs.push(name);
	app_trimethyl_config.libs = _.uniq(app_trimethyl_config.libs);

	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(app_trimethyl_config));
	process.stdout.write('trimethyl.json file written successfully\n'.green);
});

////////////////////
// Remove command //
////////////////////

program.command('remove [name]').description('Remove a Trimethyl module to your config').action(function(name) {
	name = name.replace('.', '/');

	var io = app_trimethyl_config.libs.indexOf(name);
	if (io === -1) {
		process.stdout.write('Unable to find <' + name + '> in your libs');
		return;
	}

	app_trimethyl_config.libs.splice(io, 1);
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(app_trimethyl_config));
	process.stdout.write('trimethyl.json file written successfully'.green);
});

///////////
// Start //
///////////

var app_trimethyl_config = { libs: [] };
if (fs.existsSync(CWD + '/trimethyl.json')) {
	try {
		app_trimethyl_config = require(CWD + '/trimethyl.json');
	} catch (err) {
		process.stdout.write("Unable to parse trimethyl.json file!\n".red);
		process.exit(1);
	}
}

// Alloy.js

if (!fs.existsSync(CWD + '/app/config.json')) {
	process.stdout.write("Not a valid Alloy project.\n".red);
	process.exit(1);
}
var app_config = require(CWD + '/app/config.json');

// Tiapp.xml

var tiapp = require('tiapp.xml').load('./tiapp.xml');
if (tiapp == null) {
	process.stdout.write("Not a valid Titanium project.\n".red);
	process.exit(1);
}

program.parse(process.argv);
if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
	program.help();
	return;
}