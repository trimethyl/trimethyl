// Requirements: gittio install -g analytics.google

var $$ = require('analytics.google');
var $T = null;
var config = {
	ua: null
};

exports.trackEvent = function(e){
	if (!$T) return;
	e.label = e.label || e.action;
	e.value = e.value || 0;
	$$.trackEvent(e);
};

exports.trackScreen = function(name){
	if (!$T) return;
	$T.trackScreen(name);
};

exports.trackSocial = function(e){
	if (!$T) return;
	$T.trackSocial(e);
};

exports.init = function(c){
	config = _.extend(config, c);
	$$.trackUncaughtExceptions = true;
	$$.debug = Alloy.CFG.debug;
	$T = $$.getTracker(config.ua);
};