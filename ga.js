/*

Google Analitycs module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio install -g analytics.google

*/

var config = {
	ua: null
};

var $$ = require('analytics.google');
var $T = null;


exports.trackEvent = exports.event = function(cat, act, lbl, val){
	if (!$T) { return; }

	if (act) {
		$T.trackEvent(_.extend(
			{ category: cat || '', action: act || '' },
			lbl ? { label: lbl } : { label: '' },
			val ? { value: +val } : { value: 0 }
			));
	} else {
		$T.trackEvent(cat);
	}
};

exports.trackScreen = exports.screen = function(name){
	if (!$T) { return; }

	$T.trackScreen(name);
};

exports.trackSocial = exports.social = function(net, act, tar){
	if (!$T) { return; }

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
	$$.debug = false;

	if (config.ua) {
		$T = $$.getTracker(config.ua);
	}
};