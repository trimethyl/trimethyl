/*

Google Analitycs module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio install -g analytics.google

*/

var config = _.extend({
	ua: null
}, Alloy.CFG.ga);

var $ = require('analytics.google');
var $T = null;

exports.trackEvent = exports.event = function(cat, act, lbl, val){
	if (!$T) return;

	if (_.isObject(cat)) {
		$T.trackEvent(cat);
	} else {

		var obj = {};
		obj.category = cat;
		obj.action = act;
		obj.label = lbl ? lbl : '';
		obj.value = val ? +val : 0;

		$T.trackEvent(obj);
	}
};

exports.trackScreen = exports.screen = function(name){
	if (!$T) return;

	$T.trackScreen(name);
};

exports.trackSocial = exports.social = function(net, act, tar){
	if (!$T) return;

	if (_.isObject(net)) {
		$T.trackSocial(net);
	} else {

		var obj = {};
		obj.network = net;
		obj.action = act || 'share';
		obj.target = tar || '';

		$T.trackSocial(obj);
	}
};

(function init(){
	$.trackUncaughtExceptions = true;
	$.debug = false;

	if (config.ua) {
		$T = $.getTracker(config.ua);
	}
})();