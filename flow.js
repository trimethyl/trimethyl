/*

Flow module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

var cc = null;
var ccs = null;
var cca = null;
var hist = [];

function closeController(c) {
	if (!c) {
		return;
	}

	try {
		if ('close' in c) {
			c.close();
		} else {
			console.warn("Implement close function in controllers!");
			c.getView().close();
		}
	} catch (e) {
		console.error(e);
	}
}

exports.create = exports.open = function create(controller, args, unclosePrev) {
	args = args || {};

	var C = require('alloy').createController(controller, args);
	if ('open' in C) {
		C.open();
	} else {
		console.warn("Implement open function in controllers!");
		C.getView().open();
	}

	hist.push({ controller: controller, args: args });

	if (cc && !unclosePrev) closeController(cc);
	ccs = controller;
	cca = args;
	cc = C;

	return cc;
};

exports.back = exports.goBack = back = function() {
	if (hist.length<2) {
		return;
	}

	var last = hist.pop().pop();
	create(last.controller, last.args);
};

exports.getCurrentControllerStr = function(){ return ccs; };
exports.getCurrentControllerArgs = function() { return cca; };
exports.current = exports.getCurrentController = function() { return cc; };
exports.closeCurrent = function() { closeController(cc); };

exports.getHistory = function() { return hist; };
exports.clearHistory = function() { hist = []; };

exports.reload = function() { open(ccs, cca); };

exports.init = function(c) {
	config = _.extend(config, c);
};
