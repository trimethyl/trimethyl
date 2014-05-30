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
}, Alloy.CFG.ga);
exports.config = config;


var $ = require('analytics.google');
var $TRACKER = null;


/**
 * Track an event
 *
 * @param  {String} cat The category **or the object passed to the module**
 * @param  {String} act The action associated
 * @param  {String} lbl The label associated
 * @param  {String} val The value associated
 */
function trackEvent(cat, act, lbl, val){
	if (!$TRACKER) return;

	if (_.isObject(cat)) {
		$TRACKER.trackEvent(cat);
	} else {

		var obj = {};
		obj.category = cat;
		obj.action = act;
		obj.label = lbl ? lbl : '';
		obj.value = val ? +val : 0;

		$TRACKER.trackEvent(obj);
	}
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
	if (!$TRACKER) return;

	$TRACKER.trackScreen(name);
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
 * @param  {String} net The social network: facebook, twitter, googleplus...
 * @param  {String} act The action associated
 * @param  {String} tar The target associated
 */
function trackSocial(net, act, tar){
	if (!$TRACKER) return;

	if (_.isObject(net)) {
		$TRACKER.trackSocial(net);
	} else {

		var obj = {};
		obj.network = net;
		obj.action = act || 'share';
		obj.target = tar || '';

		$TRACKER.trackSocial(obj);
	}
}
exports.trackSocial = trackSocial;

/**
 * @method social
 * @inheritDoc #trackSocial
 * Alias for {@link #trackSocial}
 */
exports.social = trackSocial;

/**
 * Set the tracker UA.
 * @param {String} ua
 */
function setTrackerUA(ua) {
	$TRACKER = $.getTracker(ua);
}
exports.setTrackerUA = setTrackerUA;


(function init(){
	$.trackUncaughtExceptions = true;
	$.debug = false;

	if (config.ua) {
		setTrackerUA(config.ua);
	}
})();
