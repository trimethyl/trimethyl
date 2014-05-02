/*

Flow module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({
	useNav: true,
	trackWithGA: true
}, Alloy.CFG.flow);

var $_CC = null;
var $_CCS = null;
var $_CCA = null;
var hist = [];

var $nav = null;


exports.setNavigationController = function(e, open) {
	$nav = e;
	if (open) {
		$nav.open();
	}
};

exports.getNavigationController = function() {
	return $nav;
};

function closeController(controller) {
	if (!controller) {
		return;
	}

	if ('close' in controller) {
		controller.close();
	} else {
		controller.getView().close();
	}
}

exports.openDirect = function(controller, args) {
	// Open the controller
	Alloy.createController(controller, args || {});

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('ga').trackScreen(controller);
	}
};

exports.open = function(controller, args, opt) {
	if (!args) args = {};
	if (!opt) opt = {};

	var $C = Alloy.createController(controller, args);
	var $W = $C.getView();

	if (config.useNav) {

		if (!$nav) {
			console.error("Please define a NavigationController");
			return;
		}
		$nav.openWindow($W, opt.openArgs || {});

	} else {

		if ('open' in $C) {
			$C.open();
		} else {
			$W.open(opt.openArgs || {});
		}

	}


	// Attach events
	$W.addEventListener('close', function(e){
		$C.destroy();
		$C = null;
		$W = null;
	});

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('ga').trackScreen(controller);
	}

	hist.push({
		controller: controller,
		args: args
	});

	if (!config.useNav && !opt.singleTask) {
		if ($_CC) closeController($_CC);
	}

	$_CCS = controller;
	$_CCA = args;
	$_CC = $C;
	return $_CC;
};

exports.back = function() {
	if (hist.length<2) return;
	var last = hist.pop().pop();
	open(last.controller, last.args);
};

exports.current = function(){
	return {
		controller: $_CC,
		info : {
			name: $_CCS,
			args: $_CCA
		}
	};
};

exports.closeCurrent = function() {
	closeController($_CC);
};

exports.getHistory = function() {
	return hist;
};

exports.clearHistory = function(){
	hist = [];
};