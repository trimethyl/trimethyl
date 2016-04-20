#!/usr/bin/env node
var fs = require('fs-extended');
var path = require('path');
var _ = require('underscore');
var program = require('commander');
var inquirer = require('inquirer');
var prompt = require('prompt');

var CWD = process.cwd();

var trimethyl_map = require('./map.json');
var package = require('./package.json');

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

	var stat = fs.statSync(src_file).size;

	libs[key] = _.extend({}, val, {
		requiredBy: req,
		tabs: tabs,
		dst_file: dst_file,
		src_file: src_file,
		stat: stat,
		size: (stat / 1000).toFixed(2) + ' KB'
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

function writeConfig() {
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(app_trimethyl_config));
}

function addModule(name) {
	app_trimethyl_config.libs.push(name);
	app_trimethyl_config.libs = _.uniq(app_trimethyl_config.libs);
}

function preInstall() {
	if (_.isEmpty(app_trimethyl_config.libs)) {
		inquirer.prompt([{
			type: 'checkbox',
			name: 'modules',
			message: "Select the modules you want to install:",
			choices: _.map(trimethyl_map, function(e, k) { return { name: e.name, value: k }; })
		}], function (ans) {
			if (_.isEmpty(ans.modules)) {
				process.stdout.write("Please select at least one module.".red);
				process.exit(1);
			}

			ans.modules.forEach(function(e) { addModule(e); });
			writeConfig();

			install();
		});
	} else {
		install();
	}
}

function install() {
	// Get the libraries to copy in /Resources
	var libs_to_copy = {};
	(["trimethyl"].concat( app_trimethyl_config.libs )).forEach(function(v) {
		buildDependencies(libs_to_copy, v);
	});
	libs_to_copy = _.toArray(libs_to_copy);

	var items = [];

	// Star the chaining
	(function checkLibs(copy_libs_callback) {
		if (libs_to_copy.length === 0) {
			return copy_libs_callback();
		}

		var info = libs_to_copy.shift();
		items.push(info);

		(function installModules(install_modules_callback) {
			if (info.modules == null || info.modules.length === 0) {
				return install_modules_callback();
			}

			var module_def = info.modules.shift().split(':');
			var module = module_def[0];
			var platform = module_def[1];

			if (platform !== 'commonjs' && !tiapp.getDeploymentTarget(platform)) {
				installModules(install_modules_callback);
				return;
			}

			if (null == _.find(tiapp.getModules(), function(m) {
				return m.id == module && m.platform == platform;
			})) {
				inquirer.prompt([{
					type: 'expand',
					name: 'result',
					message: "<" + info.name + "> requires the native module <" + module + "> for the platform <" + platform + ">",
					choices: [
						{ key: 'a', name: 'Add to the "tiapp.xml"', value: 'add' },
						{ key: 'i', name: 'Install via Gittio', value: 'install' },
						{ key: 's', name: 'Skip', value: 'skip' },
						{ key: 'e', name: 'Exit', value: 'exit' }
					]
				}], function (ans) {
					if (ans.result === 'add') {
						tiapp.setModule(module, { platform: platform });
						tiapp.write();
						installModules(install_modules_callback);

					} else if (ans.result === 'install') {
						require('child_process').exec('gittio install ' + module + ' -p ' + platform, function(error, stdout, stderr) {
							if (stderr) process.stdout.write(stderr.replace(/\[.+?\] /g, '').red);
							else process.stdout.write(stderr.replace(/\[.+?\] /g, '').gray);
							installModules(install_modules_callback);
						});

					} else if (ans.result === 'skip') {
						installModules(install_modules_callback);

					}
				});
			} else {
				installModules(install_modules_callback);
			}
		})(function() {
			checkLibs(copy_libs_callback);
		});

	})(function() {

		process.stdout.write("\n");

		installOnFileSystem(items);

		app_trimethyl_config.version = package.version;
		app_trimethyl_config.install_date = Date.now();	
		writeConfig();

		process.stdout.write('\nInstalled version: ' + ('v' + app_trimethyl_config.version).green + '\n');

		var total_size = _.reduce(_.pluck(items, 'stat'), function(s,e) { return s + e; }, 0);
		process.stdout.write('Occupied space: ' + ( (total_size / 1000).toFixed(2) + ' KB' ).green + '\n');

	});
}

function installOnFileSystem(items) {
	if (!fs.existsSync(CWD + '/app/lib')) {
		fs.mkdirSync(CWD + '/app/lib');
	}

	fs.deleteDirSync(CWD + '/app/lib/T');
	fs.mkdirSync(CWD + '/app/lib/T');

	_.each(items, function(info) {
		var dir_name = path.dirname(info.dst_file);
		if (!fs.existsSync(dir_name)) {
			fs.createDirSync(dir_name);
		}

		var tabs = info.tabs ? new Array(Math.max(0,(info.tabs||0)-1)*4).join(' ') + '└' + new Array(3).join('─') : '';
		process.stdout.write((tabs + 'Installing ' + info.name + ' (' + info.size + ')\n').grey);

		fs.copyFileSync(info.src_file, info.dst_file);
	});
}

/////////////////////
// Install command //
/////////////////////

program.command('install').alias('i').description('Install the framework files').action(function() {
	if (compareVersions(app_trimethyl_config.version, package.version) === 1) {
		inquirer.prompt([{
			type: 'confirm',
			name: 'result',
			message: "You are doing a downgrade from " + app_trimethyl_config.version + ' to ' + package.version + ", are you sure to install?".yellow,
			default: false
		}], function(ans) {
			if (ans.result) {
				preInstall();
			}
		});
	} else {
		preInstall();
	}
});

//////////////////
// List command //
//////////////////

program.command('list').alias('ls').description('List all Trimethyl available modules').action(function() {
	_.each(trimethyl_map, function(m, k) {
		if (m.internal) return;

		var dots = m.name.match(/\./g);
		var tabs = new Array( dots ? dots.length*4 : 0 ).join(' ');
		process.stdout.write( tabs + (m.name).green + " (" + k.yellow + ") - " + m.description + "\n");
	});
});

/////////////////
// Add command //
/////////////////

program.command('add [name]').alias('a').description('Add a Trimethyl module to your config').action(function(name) {
	if (!(name in trimethyl_map)) {
		process.stdout.write(('<' + name + '> is not a valid Trimethyl module.').red);
		process.exit();
	}

	if (trimethyl_map[name].internal) {
		process.stdout.write(('<' + name + '> is an internal module.').red);
		process.exit();
	}

	addModule(name);
	writeConfig();
});

////////////////////
// Remove command //
////////////////////

program.command('remove [name]').alias('r').description('Remove a Trimethyl module to your config').action(function(name) {
	name = name.replace('.', '/');

	var io = app_trimethyl_config.libs.indexOf(name);
	if (io === -1) {
		process.stdout.write('Unable to find <' + name + '> in your libs');
		return;
	}

	app_trimethyl_config.libs.splice(io, 1);
	writeConfig();
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
	process.stdout.write("This is not a valid Alloy project.\n".red);
	process.exit(1);
}
var app_config = require(CWD + '/app/config.json');

// Tiapp.xml

var tiapp = require('tiapp.xml').load('./tiapp.xml');
if (tiapp == null) {
	process.stdout.write("This is not a valid Titanium project.\n".red);
	process.exit(1);
}

program.parse(process.argv);
if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
	program.help();
	return;
}