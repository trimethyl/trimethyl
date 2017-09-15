/**
 * @module  ga
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.ua=null]		The Google Analytics UA
 * @property {String} [config.log=false] 	Log the queries
 * @type {Object}
 */
exports.config = _.extend({
	ua: null,
	log: false,
	enableAdvertisingIdCollection: false,
}, Alloy.CFG.T ? Alloy.CFG.T.ga : {});

var Util = require('T/util');

var AnalyticsGoogle = Util.requireOrNull('ti.ga');
var tracker = null;

var MODULE_NAME = 'GA';

function track(method, what) {
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}
	if (_.isEmpty(what)) return;

	if (exports.config.log === true) {
		Ti.API.trace(MODULE_NAME + ": Track", method, what);
	}

	try {
		tracker['add' + method](what);
	} catch (err) {
		Ti.API.error(MODULE_NAME + ': Error while calling method ' + method, err);
	}
}

/**
 * Track an event
 * @param  {String} cat 	Category **or object passed to native proxy**
 * @param  {String} act 	The action
 * @param  {String} [lbl=""] 	Label
 * @param  {String} [val=0]	Value
 */
exports.trackEvent = function(cat, act, lbl, val){
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}

	var obj;

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj = {
			category: cat,
			action: act,
			label: lbl || '',
			value: +val || 0,
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
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}
	var obj;

	try {
		if (_.isObject(name)) {
			tracker.addScreenView(name.name, _.omit(name, 'name'));
		} else {
			tracker.addScreenView(name, {});
		}

		if (exports.config.log === true) {
			Ti.API.trace(MODULE_NAME + ": Track", "Screen", name);
		}
	} catch (err) {
		Ti.API.error(MODULE_NAME + ': Error while calling method ScreenView', err);
	}
};

/**
 * @link #trackScreen
 */
exports.screen = exports.trackScreen;


/**
 * Track a social action
 *
 * @param  {String} net The social network name **or object passed to native proxy**
 * @param  {String} [act="share"] The action
 * @param  {String} [tar=""] Target
 */
exports.trackSocial = function(net, act, tar){
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}
	var obj;

	if (_.isObject(net)) {
		obj = net;
	} else {
		obj = {
			network: net,
			action: act || 'share',
			target: tar || '',
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
 * @param  {String} cat Category **or object passed to native proxy**
 * @param  {String} time Time expressed in ms
 * @param  {String} [name=""] Name
 * @param  {String} [lbl=""] Label
 */
exports.trackTiming = function(cat, time, name, lbl) {
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}
	var obj;

	if (_.isObject(cat)) {
		obj = cat;
	} else {
		obj = {
			category: cat,
			time: time,
			name: name || '',
			label: lbl || '',
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
 * @param  {Boolean} [fatal=false] Indicate if the error is a fatal error
 */
exports.trackException = function(description, fatal) {
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}
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
	Ti.API.debug(MODULE_NAME + ': Initialized with UA = ' + ua);
	tracker = AnalyticsGoogle.createTracker({
		trackingId: ua,
		useSecure: true,
		enableAdvertisingIdCollection: exports.config.enableAdvertisingIdCollection,
	});
};

/**
 * Start a new session.
 */
exports.startSession = function() {
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}

	tracker.startSession();
};

/**
 * Associate an user id to the GA data for the current session.
 * @param {} id An user id
 */
exports.setUserID = function(id) {
	if (tracker === null) {
		Ti.API.error(MODULE_NAME + ': Ti.GA module not initialized.');
		return;
	}

	tracker.setUserID(id);
};

//////////
// Init //
//////////

if (exports.config.ua != null) {
	if (AnalyticsGoogle != null) {
		exports.setTrackerUA(exports.config.ua);
		AnalyticsGoogle.setTrackUncaughtExceptions();
	} else {
		Ti.API.error(MODULE_NAME + ': initialization failed, unable to find module');
	}
} else {
	Ti.API.error(MODULE_NAME + ': initialization failed, invalid UA');
}
