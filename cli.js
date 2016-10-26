#!/usr/bin/env node

var package = require('./package.json');

var fs = require('fs-extended');
var path = require('path');
var _ = require('underscore');
var program = require('commander');
var inquirer = require('inquirer');
var prompt = require('prompt');
var ga = require('universal-analytics')(package.ua);
var child_process = require('child_process');
var async = require('async');
var gittio = require('gittio');

// Current directory
var CWD = process.cwd();

// This represents the entire module map
var trimethyl_map = require('./map.json');

// The src install path
var DEFAULT_SOURCE_PATH = '/framework/';

// And the dest path in the project (except for Alloy adapters)
var DEFAULT_DEST_PATH = '/app/lib/T/';

// Log an event to the CLI + GA, and miserably exit
function error(msg, code, dont_exit) {
	ga.event("error", "error", msg).send();
	process.stdout.write(msg.red);
	
	if (dont_exit == false) {
		process.exit( code || 1 );
	}
}

// From a set of modules, return a full array of objects that
// have all informations about src and dest paths,
// and add all modules dependencies
function addLibraryToHashMap(libs, lib_name, lib_required_by_lib_name, no_of_tabs) {
	lib_required_by_lib_name = lib_required_by_lib_name || null;
	no_of_tabs = no_of_tabs || 0;

	// Do not process twice the same library, we use an HashMap to do that
	if (lib_name in libs) return;

	var lib = trimethyl_map[ lib_name ];
	if (lib == null) {
		error('Unable to find the referenced library "' + lib_name + '"', null, false);
	}

	var src_file = __dirname + DEFAULT_SOURCE_PATH + lib_name + '.js';
	var dst_file = CWD + DEFAULT_DEST_PATH + lib_name + '.js';

	// Overwrite default destination if specified in the library (Alloy adapters)
	if (lib.destination) {
		dst_file = CWD + lib.destination;
	}

	// Overwrite default source if specified in the library (node_modules)
	if (lib.source) {
		src_file = __dirname + lib.source;
	} 
	
	var stat = fs.statSync(src_file).size;
	var size = (stat / 1000).toFixed(2) + ' KB';

	libs[ lib_name ] = _.extend({}, lib, {
		lib_required_by_lib_name: lib_required_by_lib_name,
		no_of_tabs: no_of_tabs,
		dst_file: dst_file,
		src_file: src_file,
		stat: stat,
		size: size,
		modules: lib.modules
	});

	// Now, iterate over the dependencies and recursively 
	// build the dependencies
	(lib.dependencies || []).forEach(function(dependency_lib) {
		addLibraryToHashMap(libs, dependency_lib, lib_name, no_of_tabs + 1);
	});
}

// Compare two versions, with this rule
// if a>b => 1, a=b => 0, a<b => -1
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

// Compare only that major
function compareMajorVersions(a, b) {
	if (a == null || b == null) return 0;
	return compareVersions(a.split('.')[0], b.split('.')[0]);
}

/////////////////////////
// Configure commander //
/////////////////////////

program
.version(package.version, '-v, --version')
.description(package.description)
.usage('command <args> [options]');

// Notify user of new version
var notifier = (require('update-notifier'))({ pkg: package });
if (notifier.update) {
	notifier.notify();
}

// Write the config file from the app_trimethyl_config var
function writeConfig() {
	fs.writeFileSync(CWD + '/trimethyl.json', JSON.stringify(app_trimethyl_config, null, 2));
}

// Add a module to app_trimethyl_config
function addModule(name) {
	app_trimethyl_config.libs.push(name);
}

// This method check if a config file is found.
// If found, proceed to the installtion,
// otherwise, ask to the user which modules wants to install
function preInstall() {
	ga.event("installation", "preinstall").send();

	if (_.isEmpty(app_trimethyl_config.libs)) {

		var choices = trimethyl_map.map(function(e, k) { 
			return { 
				name: e.name, 
				value: k 
			}; 
		});

		inquirer.prompt([{
			type: 'checkbox',
			name: 'libraries',
			message: "Select the libraries you want to install: ",
			choices: choices
		}], function (ans) {
			if (_.isEmpty(ans.libraries)) {
				error("Please select at least one module.");
			}

			// Add the module to the user library
			ans.libraries.forEach(addModule);

			// Write the config to the file system
			writeConfig();

			// And instantly proceed with the installation
			install();

		});

	} else {
		install();
	}
}

function ensureFilesystemStructure() {
	// Esnure that app/lib exists
	if (!fs.existsSync(CWD + '/app/lib')) {
		fs.mkdirSync(CWD + '/app/lib');
	}

	fs.deleteDirSync(CWD + '/app/lib/T');
	fs.mkdirSync(CWD + '/app/lib/T');

	// Copy a README that indicates that the directory is auto-generated
	// and can be deleted in any moment from the installaer
	fs.copyFileSync(__dirname + '/INSTALLATION_README', CWD + '/app/lib/T/README');
}

function copyLibToFilesystem(lib, callback) {
	// Check the filesystem structure before copying the file
	var dir_name = path.dirname(lib.dst_file);
	if (!fs.existsSync(dir_name)) {
		fs.createDirSync(dir_name);
	}

	// Just print a beatiful graph
	var tabs_to_print = lib.no_of_tabs ? new Array(Math.max(0, (lib.no_of_tabs || 0) - 1) * 3 ).join(' ') + '└' + new Array(3).join('─') : '';
	process.stdout.write(tabs_to_print.grey + 'Copying '.grey + lib.name.bold.white + (' (' + lib.size + ')\n').grey );

	// And copy the file
	fs.copyFile(lib.src_file, lib.dst_file, callback);
}

// Just add to the tiapp.xml (the module could be installed globally, 
// so this is a valid installation "method" for the module)
function installNativeModuleByAdd(module, platform, callback) {
	ga.event("installation", "module_add", module).send();

	tiapp.setModule(module, { platform: platform });
	tiapp.write();

	callback();
}

// Required gittio to be installed and install the module via GITTIO 
function installNativeModuleViaGittio(module, platform, callback) {
	ga.event("installation", "module_install", module).send();

	var cmd = 'gittio install ' + module + ' -p ' + platform;
	process.stdout.write( ('Executing <' + cmd + '>...\n').yellow );

	child_process.exec(cmd, function(err, stdout, stderr) {
		process.stdout.write( (stdout || stderr).replace(/\[.+?\] /g, '').gray );
		callback();
	});
}

function installNativeModule(lib, module_def, callback) {
	module_def = module_def.split(':');
	
	var module = module_def[0];
	var platform = module_def[1];

	// Do not install modules that are not for this app platforms (commonjs is an exception)
	if (platform !== 'commonjs' && !tiapp.getDeploymentTarget(platform)) {
		callback();
		return;
	}

	var module_already_installed = _.find(tiapp.getModules(), function(m) {
		return m.id == module && m.platform == platform;
	});

	if (module_already_installed) {
		callback();
		return;
	}

	// Ask to the user if he wants
	// to "A" (add) to the tiapp.xml
	// to "I" (install) via GITTIO (not supported in the future)
	// to "S" (skip) the installation of this module
	// to "E" (exit) and cancel the installation
	inquirer.prompt([{
		type: 'expand',
		name: 'result',
		message: "<" + lib.name + "> requires the native module <" + module + "> for the platform <" + platform + ">",
		choices: [
		{ key: 'a', name: 'Add to the "tiapp.xml"', value: 'add' },
		{ key: 'i', name: 'Install via Gittio', value: 'install' },
		{ key: 's', name: 'Skip', value: 'skip' },
		{ key: 'e', name: 'Exit', value: 'exit' }
		]
	}], function (ans) {
		switch (ans.result) {
			case 'add':
			installNativeModuleByAdd(module, platform, callback);
			break;

			case 'install':
			installNativeModuleViaGittio(module, platform, callback);
			break;

			case 'skip':
			ga.event("installation", "module_skipped", module).send();
			callback();
			break;

			case 'exit':
			error("Process interrupted by the user");
			break;
		}
	});
}

function preInstallLib(lib, callback) {
	// Check if the lib doesn't require any native modules that the end user doesn't have installed yet
	async.eachSeries(lib.modules || [], function(module, callback) {
		installNativeModule(lib, module, callback);
	}, callback);
}

function installLib(lib, callback) {
	copyLibToFilesystem(lib, callback);
}

function finishInstallation(libs) {
	ga.event("installation", "end").send();

	// Change the installed version and the current installation date
	app_trimethyl_config.version = package.version;
	app_trimethyl_config.install_date = Date.now();
	writeConfig();

	process.stdout.write('\nInstalled version: ' + ('v' + app_trimethyl_config.version).green + '\n');

	var total_size = _.reduce(_.pluck(libs, 'stat'), function(s,e) { return s + e; }, 0);
	process.stdout.write('Occupied space: ' + ( (total_size / 1000).toFixed(2) + ' KB' ).green + '\n');
}

// This function copy the files to the destination directory, building all dependencies upfront
function install() {
	var libs = {};

	// Add trimethyl anyway, we REQUIRE it
	(["trimethyl"].concat( app_trimethyl_config.libs )).forEach(function(lib) {
		ga.event("installation", "module", lib).send();
		addLibraryToHashMap(libs, lib);
	});
	libs = _.toArray(libs);

	// Ensure the all directories are created upfront
	ensureFilesystemStructure();

	// Now cycle (async) over all libraries and install them
	async.eachSeries(libs, preInstallLib, function(err) {
		async.eachSeries(libs, installLib, function(err) {
			finishInstallation(libs);
		});
	});
}

/////////////////////
// Install command //
/////////////////////

program.command('install').alias('i').description('Install the framework files').action(function() {
	ga.pageview("/install").send();

	if (app_trimethyl_config.version == null) {
		preInstall();
		return;
	}

	var comparision = compareVersions(package.version, app_trimethyl_config.version);

	if (comparision === -1) {
		inquirer.prompt([{
			type: 'confirm',
			name: 'result',
			message: ("You are doing a downgrade from " + app_trimethyl_config.version + ' to ' + package.version + ", are you sure to install?").yellow,
			default: false
		}], function(ans) {
			ga.event("installation", "downgrade").send();

			if (ans.result) {
				preInstall();
			}
		});

	} else if (comparision === 1) {
		if (compareMajorVersions(package.version, app_trimethyl_config.version) === 1) {
			inquirer.prompt([{
				type: 'confirm',
				name: 'result',
				message: ("You are doing a major upgrade from " + app_trimethyl_config.version + " to " + package.version + "\nThis means that some features have changed from one release to the other, you have to check the project very carefully after doing that.\nAre you sure to install?").yellow
			}], function(ans) {
				ga.event("installation", "majorupgrade").send();

				if (ans.result) {
					preInstall();
				}
			});

		} else {
			ga.event("installation", "upgrade").send();
			preInstall();
		}

	} else if (comparision === 0) {
		ga.event("installation", "uptodate").send();
		preInstall();
	}
});

//////////////////
// List command //
//////////////////

program.command('list').alias('ls').description('List all Trimethyl available modules').action(function() {
	ga.pageview("/list").send();

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
	ga.pageview("/add/" + name).send();

	if (!(name in trimethyl_map)) {
		error('<' + name + '> is not a valid Trimethyl library.');
	}

	if (trimethyl_map[name].internal) {
		error('<' + name + '> is an internal library.');
	}

	addModule(name);
	writeConfig();
});

////////////////////
// Remove command //
////////////////////

program.command('remove [name]').alias('r').description('Remove a Trimethyl module to your config').action(function(name) {
	ga.pageview("/remove/" + name).send();
	name = name.replace('.', '/');

	var io = app_trimethyl_config.libs.indexOf(name);
	if (io === -1) {
		error('Unable to find <' + name + '> in your library');
	}

	app_trimethyl_config.libs.splice(io, 1);
	writeConfig();
});

//////////////////////
// Update trimethyl //
//////////////////////

program.command('update').alias('r').description('Do a full upgrade of Trimethyl and its modules').action(function(name) {
	ga.pageview("/update").send();
	child_process.exec('cd ' + __dirname + ' && npm install && cd ' + CWD);
});


///////////
// Start //
///////////

var app_trimethyl_config = { libs: [] };
if (fs.existsSync(CWD + '/trimethyl.json')) {
	try {
		app_trimethyl_config = require(CWD + '/trimethyl.json');
	} catch (err) {
		error("Unable to parse trimethyl.json file.");
	}
}

// Alloy.js

if (!fs.existsSync(CWD + '/app/config.json')) {
	error("This is not a valid Alloy project.");
}

var app_config = require(CWD + '/app/config.json');

// Tiapp.xml

var tiapp = require('tiapp.xml').load('./tiapp.xml');
if (tiapp == null) {
	error("This is not a valid Titanium project.");
}

program.parse(process.argv);

if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
	ga.pageview("/help");
	program.help();
} else {
	ga.pageview("/");
}