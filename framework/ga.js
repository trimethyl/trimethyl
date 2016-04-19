/**
 * @module  gA
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} 	config.dryRun		Enable debug mode. This will prevent sending data to Google Analytics.
 * @type {Object}
 */
exports.config = _.extend({
}, Alloy.CFG.T ? Alloy.CFG.T.ga : {});

var Util = require('T/util');

var AnalyticsGoogle = Util.requireOrNull('ti.ga');
var tracker = null;

function track(method, what) {
	if (tracker === null) return;
	if (_.isEmpty(what)) return;

	try {
		tracker['add' + method](what);
	} catch (err) {
		Ti.API.error('GA: Error while calling method ' + method, err);
	}
}


/**
 * Track an event
 * @param  {String} cat 	Category **or object passed to native proxy**
 * @param  {String} act 	The action
 * @param  {String} [lbl] 	Label
 * @param  {String} [val]	Value
 */
exports.trackEvent = function(cat, act, lbl, val){
	if (tracker === null) return;
	var obj;

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj = {
			category: cat,
			action: act,
			label: lbl || '',
			value: +val || 0
		};
	}

	track('Event', obj);
};


/**
 * @link #trackEvent
 */
exports.event = exports.trackEvent;


/**
 * Track a screen
 * @param  {String} name 	The screen name
 */
exports.trackScreen = function(name) {
	if (tracker === null) return;
	var obj;

	try {
		tracker.addScreenView(name);
	} catch (err) {
		Ti.API.error('GA: Error while calling method ScreenView', err);
	}
};

/**
 * @link #trackScreen
 */
exports.screen = exports.trackScreen;


/**
 * Track a social action
 *
 * @param  {String} net 		The social network name **or object passed to native proxy**
 * @param  {String} [act] 		The action (Default `share`)
 * @param  {String} [tar] 		Target
 */
exports.trackSocial = function(net, act, tar){
	if (tracker === null) return;
	var obj;

	if (_.isObject(net)) {
		obj = net;
	} else {
		obj = {
			network: net,
			action: act || 'share',
			target: tar || ''
		};
	}

	track('SocialNetwork', obj);
};

/**
 * @link #trackSocial
 */
exports.social = exports.trackSocial;



/**
 * Track timing
 *
 * @param  {String} cat 		Category **or object passed to native proxy**
 * @param  {String} time 		Time expressed in ms
 * @param  {String} [name] 	Name
 * @param  {String} [lbl]		Label
 */
exports.trackTiming = function(cat, time, name, lbl){
	if (tracker === null) return;
	var obj;

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj = {
			category: cat,
			time: time,
			name: name || '',
			label: lbl || ''
		};
	}

	track('Timing', obj);
};

/**
 * @link #trackTiming
 */
exports.time = exports.trackTiming;


/**
 * @param  {String} description 	The description of the exception **or object passed to native proxy**
 * @param  {Boolean} fatal       Fatal or not?
 */
exports.trackException = function(description, fatal) {
	if (tracker === null) return;
	var obj;

	if (_.isObject(description)) {
		obj = description;
	} else {
		obj = {
			description: description,
			fatal: !!fatal
		};
	}

	track('Exception', obj);
};

/**
 * @link #trackException
 */
exports.exception = exports.trackException;


/**
 * Set the tracker UA.
 * @param {String} ua
 */
exports.setTrackerUA = function(ua) {
	Ti.API.debug('GA: Initialized with UA = ' + ua);
	tracker = AnalyticsGoogle.createTracker({
		trackingId: ua,
		useSecure: true
	});
};

//////////
// Init //
//////////

var ua = null;

if (Ti.App.Properties.hasProperty('ga.ua')) {
	ua = Ti.App.Properties.getString('ga.ua', null);
} else {
	if (exports.config.ua != null) {
		Ti.API.warn('GA: Setting UA in the config.json is DEPRECATED, set it in the tiapp.xml');
		ua = exports.config.ua; 
	}
}

if (ua != null) {
	if (AnalyticsGoogle != null) {
		exports.setTrackerUA(ua);
		AnalyticsGoogle.setTrackUncaughtExceptions();
	} else {
		Ti.API.error('GA: initialization failed, unable to find module');
	}
} else {
	Ti.API.warn('GA: initialization failed, invalid UA');
}
