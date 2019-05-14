/**
 * @module  firebase/analytics
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 * @property {String} [config.log=false] 	Set to true to display log messages for each call
 * @type {Object}
 */
exports.config = _.extend({
	log: false,
}, (Alloy.CFG.T && Alloy.CFG.T.firebase) ? Alloy.CFG.T.firebase.analytics : {});

var MODULE_NAME = 'firebase/analytics';

var Util = require('T/util');
var FC = Util.requireOrNull('firebase.core');
var FA = Util.requireOrNull('firebase.analytics');

function checkModules() {
	if (FC === null) {
		Ti.API.error(MODULE_NAME + ': firebase.core module not initialized.');
		return false;
	} else if (FA === null) {
		Ti.API.error(MODULE_NAME + ': firebase.analytics module not initialized.');
		return false;
	}

	return true;
}

/**
 * Reference to the Firebase Analytics module.
 * @see {@link https://github.com/hansemannn/titanium-firebase-analytics}
 */
exports.Module = FA;

/**
 * Track an event
 * @see {@link https://github.com/hansemannn/titanium-firebase-analytics#logname-parameters}
 * @param  {String} name
 * @param  {Object} [parameters]
 */
exports.trackEvent = function(name, parameters){
	if (!checkModules()) return;
	if (_.isEmpty(name)) {
		Ti.API.error(MODULE_NAME + ': the event\'s name cannot be empty.');
	}

	if (exports.config.log === true) {
		Ti.API.trace(MODULE_NAME + ": Track event", name, JSON.stringify(parameters || {}));
	}

	FA.log(name, parameters || {});
};


/**
 * @link #trackEvent
 */
exports.event = exports.trackEvent;


/**
 * Track a screen.
 * @see {@link https://github.com/hansemannn/titanium-firebase-analytics#setscreennameandscreenclassparameters} and {@link https://firebase.google.com/docs/analytics/screenviews}
 * @param  {String} screenName
 * @param  {String} [screenClass]
 */
exports.trackScreen = function(screenName, screenClass) {
	if (!checkModules()) return;
	if (_.isEmpty(screenName)) {
		Ti.API.error(MODULE_NAME + ': the screen\'s name cannot be empty.');
	}

	var obj = {
		screenName: screenName,
		screenClass: screenClass,
	};

	if (exports.config.log === true) {
		Ti.API.trace(MODULE_NAME + ": Set screen name and class", JSON.stringify(obj));
	}

	FA.setScreenNameAndScreenClass(obj);
};

/**
 * @link #trackScreen
 */
exports.screen = exports.trackScreen;


/**
 * Track a social share action.
 * @see the `share` event in {@link https://support.google.com/firebase/answer/6317498?hl=en&ref_topic=6317484}
 * @param  {String} network 		The social network name, or an object containing the `content_type` and `item_id` attributes.
 * @param  {String} [itemId=""] 	The ID or value of the content that has been shared. Can be up to 100 characters long.
 */
exports.trackSocialShare = function(network, itemId){
	if (!checkModules()) return;
	var params = {};

	if (_.isObject(network)) {
		params = network;
	} else {
		params = {
			content_type: network,
			item_id: itemId,
		};
	}

	exports.trackEvent('share', params);
};

/**
 * @link #trackSocial
 */
exports.socialShare = exports.trackSocialShare;


//////////
// Init //
//////////

if (checkModules() && exports.config.enabled != null) {
	FA.enabled = exports.config.enabled;
}