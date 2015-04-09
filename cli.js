#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('./lib/logger');
var program = require('commander');
var package = require('./package.json');
var trimethyl = require('./index.js');

var CWD = process.cwd();

if (fs.existsSync(CWD + '/tiapp.xml') === false) {
	logger.error("Not a valid Titanium project.");
	process.exit(1);
}

if (fs.existsSync(CWD + '/app/alloy.js') === false) {
	logger.error("Not a valid Alloy project.");
	process.exit(1);
}

program
.version(package.version, '-v, --version')
.description(package.description)
.usage('command <args> [options]');

program.command('install').description('Install the framework files').action(function() {
	trimethyl.install();
});

program.command('add [name]').description('Add a Trimethyl module to your config').action(function(name) {
	trimethyl.add(name);
});

program.command('remove [name]').description('Remove a Trimethyl module to your config').action(function(name) {
	trimethyl.remove(name);
});

program.parse(process.argv);

if (program.args.length === 0 || typeof program.args[program.args.length - 1] === 'string') {
	program.help();
}