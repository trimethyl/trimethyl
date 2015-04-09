#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('./lib/logger');
var program = require('commander');
var notifier = require('update-notifier')();

var package = require('./package.json');
var trimethyl = require('./index.js');

var CWD = process.cwd();

// Prechecks
if (fs.existsSync(CWD + '/tiapp.xml') === false) {
	logger.error("Not a valid Titanium project.");
	process.exit(1);
}
if (fs.existsSync(CWD + '/app/alloy.js') === false) {
	logger.error("Not a valid Alloy project.");
	process.exit(1);
}

// Configure commander
program
.version(package.version, '-v, --version')
.description(package.description)
.usage('command <args> [options]');

// Notify user of new version
if (notifier.update) notifier.notify();

// Install command
program.command('install').description('Install the framework files').action(function() {
	trimethyl.install();
});

// Add command
program.command('add [name]').description('Add a Trimethyl module to your config').action(function(name) {
	trimethyl.add(name);
});

// Remove command
program.command('remove [name]').description('Remove a Trimethyl module to your config').action(function(name) {
	trimethyl.remove(name);
});

// Start
program.parse(process.argv);
if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
	program.help();
}