/**
 * @class  	GA
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} 	config.ua 			UA of Google Analitycs
 * @property {Boolean} 	config.dryRun		Enable debug mode. This will prevent sending data to Google Analytics.
 * @type {Object}
 */
exports.config = _.extend({
	ua: null,
	dryRun: false
}, Alloy.CFG.T ? Alloy.CFG.T.ga : {});


var AnalyticsGoogle = require('analytics.google');
var tracker = null;


function track(method, what) {
	if (_.isEmpty(what)) return;
	tracker['track' + method](what);
}


/**
 * @method trackEvent
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
 * @method event
 * @inheritDoc #trackEvent
 * Alias for {@link #trackEvent}
 */
exports.event = exports.trackEvent;


/**
 * @method trackScreen
 * Track a screen
 * @param  {String} name 	The screen name
 */
exports.trackScreen = function(screenName) {
	if (tracker === null) return;
	var obj;

	if (_.isObject(obj)) {
		obj = screenName;
	} else {
		obj = {
			screenName: screenName
		};
	}

	track('Screen', obj);
};

/**
 * @method screen
 * @inheritDoc #trackScreen
 * Alias for {@link #trackScreen}
 */
exports.screen = exports.trackScreen;


/**
 * @method trackSocial
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

	track('Social', obj);
};

/**
 * @method social
 * @inheritDoc #trackSocial
 * Alias for {@link #trackSocial}
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
 * @method time
 * @inheritDoc #trackTiming
 * Alias for {@link #trackTiming}
 */
exports.time = exports.trackTiming;


/**
 * Set the tracker UA.
 * @param {String} ua
 */
exports.setTrackerUA = function(ua) {
	tracker = AnalyticsGoogle.getTracker(ua);
};


//////////
// Init //
//////////

if (exports.config.ua != null) {

	exports.setTrackerUA( exports.config.ua );
	AnalyticsGoogle.trackUncaughtExceptions = true;
	AnalyticsGoogle.dryRun = !!exports.config.dryRun;

} else {
	Ti.API.error('GA: empty UA');
}

