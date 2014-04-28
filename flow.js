/*

Flow module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {
	useNav: true,
	trackWithGA: true
};

var Alloy = require('alloy');

var cc = null;
var ccs = null;
var cca = null;
var hist = [];

var $nav = null;

exports.setNavigationController = function(e) {
	$nav = e;
};

exports.getNavigationController = function() {
	return $nav;
};

function closeController($c) {
	if (!$c) return;

	if ('close' in $c) {
		$c.close();
	} else {
		console.warn("Implement close function in controllers.");
		$c.getView().close();
	}
}

exports.open = function(controller, args, opt) {
	args = args || {};
	opt = opt || {};

	var $C = Alloy.createController(controller, args);

	if (config.useNav) {

		if (!$nav) {
			console.error("Please define a NavigationController");
			return;
		}

		$nav.openWindow($C.getView());

	} else {

		if ('open' in $C) {
			$C.open();
		} else {
			console.warn("Implement open function in controllers.");
			$C.getView().open(opt.openArgs || {});
		}

	}

	if (config.trackWithGA) {
		require('ga').trackScreen(controller);
	}

	hist.push({
		controller: controller,
		args: args
	});

	if (!config.useNav && !opt.singleTask) {
		closeController(cc);
	}

	ccs = controller;
	cca = args;
	cc = $C;

	return cc;
};

exports.back = exports.goBack = back = function() {
	if (hist.length<2) {
		return;
	}

	var last = hist.pop().pop();
	open(last.controller, last.args);
};

exports.current = function(){
	return {
		controller: cc,
		info : {
			name: ccs,
			args: cca
		}
	};
};

exports.closeCurrent = function() {
	closeController(cc);
};

exports.getHistory = function() {
	return hist;
};

exports.clearHistory = function(){
	hist = [];
};

exports.reload = function() {
	if (config.useNav) {
		return;
	}

	return open(ccs, cca);
};

exports.init = function(c) {
	config = _.extend(config, c);
};
