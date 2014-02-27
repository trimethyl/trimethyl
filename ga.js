// Requirements: gittio install -g analytics.google

var $$ = require('analytics.google');
var $T = null;
var config = {
	ua: null
};


exports.trackEvent = function(cat,act,val,lbl){
	if (!$T) return;
	if (act) {
		$T.trackEvent(_.extend(
		{ category: cat, action: act },
		lbl ? { label: lbl } : { label: '' },
		val ? { value: val } : { value: 0 }
		));
	} else {
		$T.trackEvent(cat);
	}
};

exports.trackScreen = function(name){
	if (!$T) return;
	$T.trackScreen(name);
};

exports.trackSocial = function(net,act,tar){
	if (!$T) return;
	if (act) {
		$T.trackSocial(_.extend(
		{ network: net, action: act },
		tar ? { target: tar } : { target: '' }
		));
	} else {
		$T.trackSocial(net);
	}
};

exports.init = function(c){
	config = _.extend(config, c);
	$$.trackUncaughtExceptions = true;
	$$.debug = Alloy.CFG.debug;
	if (config.ua) $T = $$.getTracker(config.ua);
};