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
var tracker = null;

function track(method, what) {
	Ti.API.debug('GA: track' + method, what);
	tracker['track'+method](what);
}


/**
 * Track an event
 *
 * @param  {String} cat 	Category **or object passed to native proxy**
 * @param  {String} act 	The action
 * @param  {String} [lbl] 	Label
 * @param  {String} [val]	Value
 */
function trackEvent(cat, act, lbl, val){
	if (tracker === null) return;
	var obj = {};

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj.category = cat;
		obj.action = act;
		obj.label = lbl ? lbl : '';
		obj.value = val ? +val : 0;
	}

	track('Event', obj);
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
function trackScreen(obj){
	if (tracker === null) return;

	track('Screen', obj);
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
	if (tracker === null) return;
	var obj = {};

	if (_.isObject(net)) {
		obj = net;
	} else {
		obj.network = net;
		obj.action = act || 'share';
		obj.target = tar || '';
	}

	track('Social', obj);
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
	if (tracker === null) return;
	var obj = {};

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj.category = cat;
		obj.time = time;
		obj.name = name || '';
		obj.label = lbl || '';
	}

	track('Timing', obj);
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
	tracker = AnalyticsGoogle.getTracker(ua);
}
exports.setTrackerUA = setTrackerUA;


/*
Init
*/

AnalyticsGoogle.trackUncaughtExceptions = true;
AnalyticsGoogle.debug = false;

if (config.ua) {
	setTrackerUA(config.ua);
}
