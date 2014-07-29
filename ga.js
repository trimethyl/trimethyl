/**
 * @class  GA
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Proxy module for Google Analitycs
 *
 * Require 'analitycs.google'
 *
 */

/**
 * * **ua**: UA of Google Analitycs. Default: `null`
 * @type {Object}
 */
var config = _.extend({
	ua: null
}, Alloy.CFG.T.ga);
exports.config = config;


var AnalyticsGoogle = require('analytics.google');
var __tracker = null;


/**
 * Track an event
 *
 * @param  {String} cat 	Category **or object passed to native proxy**
 * @param  {String} act 	The action
 * @param  {String} [lbl] 	Label
 * @param  {String} [val]	Value
 */
function trackEvent(cat, act, lbl, val){
	if (!__tracker) return;
	var obj = {};

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj.category = cat;
		obj.action = act;
		obj.label = lbl ? lbl : '';
		obj.value = val ? +val : 0;
	}

	try {  __tracker.trackEvent(obj); } catch (err) {}
	console.log("GA: EVENT - "+JSON.stringify(obj));
}
exports.trackEvent = trackEvent;

/**
 * @method event
 * @inheritDoc #trackEvent
 * Alias for {@link #trackEvent}
 */
exports.event = trackEvent;


/**
 * Track a screen
 *
 * @param  {String} name The screen name
 */
function trackScreen(name){
	if (!__tracker) return;

	try { __tracker.trackScreen(name); } catch (err) {}
	console.log("GA: SCREEN - "+name);
}
exports.trackScreen = trackScreen;

/**
 * @method screen
 * @inheritDoc #trackScreen
 * Alias for {@link #trackScreen}
 */
exports.screen = trackScreen;


/**
 * Track a social action
 *
 * @param  {String} net 		The social network name **or object passed to native proxy**
 * @param  {String} [act] 		The action (Default `share`)
 * @param  {String} [tar] 		Target
 */
function trackSocial(net, act, tar){
	if (!__tracker) return;
	var obj = {};

	if (_.isObject(net)) {
		obj = net;
	} else {
		obj.network = net;
		obj.action = act || 'share';
		obj.target = tar || '';
	}

	try {  __tracker.trackSocial(net); } catch (err) {}
	console.log("GA: SOCIAL - "+JSON.stringify(obj));
}
exports.trackSocial = trackSocial;

/**
 * @method social
 * @inheritDoc #trackSocial
 * Alias for {@link #trackSocial}
 */
exports.social = trackSocial;



/**
 * Track timing
 *
 * @param  {String} cat 		Category **or object passed to native proxy**
 * @param  {String} time 		Time expressed in ms
 * @param  {String} [name] 	Name
 * @param  {String} [lbl]		Label
 */
function trackTiming(cat, time, name, lbl){
	if (!__tracker) return;
	var obj = {};

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj.category = cat;
		obj.time = time;
		obj.name = name || '';
		obj.label = lbl || '';
	}

	try { __tracker.trackTiming(obj); } catch (err) {}
	console.log("GA: TIME - "+JSON.stringify(obj));
}
exports.trackTiming = trackTiming;

/**
 * @method time
 * @inheritDoc #trackTiming
 * Alias for {@link #trackTiming}
 */
exports.time = trackTiming;



/**
 * Set the tracker UA.
 * @param {String} ua
 */
function setTrackerUA(ua) {
	__tracker = AnalyticsGoogle.getTracker(ua);
}
exports.setTrackerUA = setTrackerUA;


(function init(){

	AnalyticsGoogle.trackUncaughtExceptions = true;
	AnalyticsGoogle.debug = false;

	if (config.ua) {
		setTrackerUA(config.ua);
	}

})();
