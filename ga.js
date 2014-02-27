// Requirements: gittio install -g analytics.google

var $$ = require('analytics.google');
var $T = null;
var config = {
	ua: null
};

exports.track = function(cat, act) {
	if (!$T) return;
	$T.trackEvent({
		category: cat,
		action: act
	});
};

exports.trackEvent = function(e){
	if (!$T) return;
	$T.trackEvent(e);
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
	if (config.ua) $T = $$.getTracker(config.ua);
};