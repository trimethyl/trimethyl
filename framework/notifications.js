/**
 * @module  notifications
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/*
Include methods used in this module dynamically to avoid that Titanium 
static analysis doesn't include native-language methods.
 */
Ti.Network;
Ti.Network.registerForPushNotifications;

/**
 * @property config
 * @property {String} 	[config.driver="http"] 					The driver to use.
 * @property {Boolean} 	[config.autoReset=true] 				If true, set the badge count to 0 when you open/resume the application.
 * @property {String}	[config.androidModule="ti.goosh"]	The name of the Android module to load.
 * @property {Boolean}  [config.fakeRemoteDeviceUUID=false] Fake a device token
 * @type {Object}
 */
exports.config = _.extend({
	driver: 'http',
	autoReset: true,
	androidModule: 'ti.goosh',
	fakeRemoteDeviceUUID: false
}, Alloy.CFG.T ? Alloy.CFG.T.notifications : {});

var MODULE_NAME = 'notifications';

var Event = require('T/event');
var Util = require('T/util');
var Router = require('T/router');
var Q = require('T/ext/q');

// Because Ti.Goosh has the same syntax of Ti.Network,
// we can just assign the module and use it in the same way

var registered_for_push_notifications = false;

/**
 * The module used for push notifications
 * @type {Object}
 */
exports.PushModule = null;

/**
 * The options for the registerForPushNotifications method of the push module
 * @type {Object}
 */
exports.PushModuleOpt = {};

if (OS_IOS) {
	exports.PushModule = Ti.Network;
	exports.PushModuleOpt.types = [ Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND ];
} else if (OS_ANDROID) {
	exports.PushModule = require(exports.config.androidModule);
} else {
	throw new Error(MODULE_NAME + ': unsupported platform');
}

// The listeners for all received notification
exports.PushModuleOpt.callback = function(e) {

	// We must be sure that the processed payload is the same on every platform,
	// for this reason we have to parse the JSON as described
	// in Ti.Goosh documentation: https://github.com/caffeinalab/ti.goosh
	if (OS_ANDROID) {
		if (_.isString(e.data)) {
			try {
				e.data = JSON.parse(e.data);
			} catch (ex) {
				e.data = {};
			}
		}
	}

	// Auto-reset the badge when a notification is received
	// We are sure the the app is in foreground, otherwise this function is never called on background/killed state.
	if (exports.config.autoReset === true) {
		exports.resetBadge();
	}

	// Call the local module onReceived method
	if (_.isFunction(exports.onReceived)) {
		exports.onReceived(e);
	}

	// And trigger a global event with the payload
	exports.trigger('received', e);
};

var interactiveCategories = [];
var interactiveCategoriesCallbacks = {};

var INTERACTIVE_NOTIFICATIONS_CAPABLE = (OS_IOS && _.isFunction(Ti.App.iOS.createUserNotificationAction));

/**
 * Validate a device token using empiric methods.
 * It only checks the the argument is a string and its length is enough for a valid token.
 * @param  {String} 	token		The device token
 * @return {Boolean}
 */
exports.validateToken = function(token) {
	return token != null && token != "undefined" && token != "null" && token.length >= 32;
};

/**
 * @property onReceived
 * A callback called when a notification is received.
 * You can override this to handle incoming notifications, or just
 * listen to the global event "notifications.received"
 */
exports.onReceived = function(e) {
	Ti.API.info(MODULE_NAME + ': Received', e);
};

/**
 * Load a driver of current module
 */
exports.loadDriver = function(name) {
	return Alloy.Globals.Trimethyl.loadDriver(MODULE_NAME, name, {
		subscribe: function(opt) {},
		unsubscribe: function(opt) {}
	});
};

/**
 * Attach events to current module
 * @param  {String}   	name 		Event key
 * @param  {Function} 	cb 		Callback
 */
exports.on = exports.event = function(name, cb) {
	Event.on(MODULE_NAME + '.' + name, cb);
};

/**
 * Remove events to current module
 * @param  {String}   	name 		Event key
 * @param  {Function} 	cb 		Callback
 */
exports.off = function(name, cb) {
	Event.off(MODULE_NAME + '.' + name, cb);
};

/**
 * Trigger events from current module
 * @param  {String}   	name 		Event key
 * @param  {Function} 	cb 		The data
 */
exports.trigger = function(name, data) {
	Event.trigger(MODULE_NAME + '.' + name, data);
};

/**
 * Activate the notifications without a subscription to a service.
 * You can use this method to just ask to the user the permissions.
 * @param  {Object}		[opt]
 * @param  {Function}	[opt.success]	Callback to invoke on success
 * @return {Q.Promise}	[opt.error]		Callback to invoke on error
 */
exports.activate = function(opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function(_resolve, _reject) {

		var resolve = function(e) {
			Ti.API.debug(MODULE_NAME + ': activation success', e);
			exports.trigger('activation.success', e);
			opt.success(e);
			_resolve(e);
		};

		var reject = function(e) {
			Ti.API.error(MODULE_NAME + ': activation error', e);
			exports.trigger('activation.error', e);
			opt.error(e);
			_reject(e);
		};

		if (exports.config.fakeRemoteDeviceUUID) {
			Ti.API.warn(MODULE_NAME + ': faking activation');
			resolve( exports.config.fakeRemoteDeviceUUID );
			return;
		}

		var registerForPushNotifications = function() {
			if (registered_for_push_notifications) {
				resolve( exports.PushModule.remoteDeviceUUID );
			} else {
				exports.PushModule.registerForPushNotifications(_.extend(exports.PushModuleOpt, {
					success: function(e) { 
						registered_for_push_notifications = true;
						resolve(e.deviceToken); 
					},
					error: reject
				}));
			}
		};

		if (INTERACTIVE_NOTIFICATIONS_CAPABLE) {

			var userNotificationsCallback = function(settings) {
				// Instantly remove this listener
				Ti.App.iOS.removeEventListener('usernotificationsettings', userNotificationsCallback);

				if (_.isEmpty(settings.types)) {
					// The user has not accepted the notifications permissions
					return reject({ disabled: true });
				}

				registerForPushNotifications();
			};

			Ti.App.iOS.addEventListener('usernotificationsettings', userNotificationsCallback);
			Ti.App.iOS.registerUserNotificationSettings({
				types: [
				Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE,
				Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
				Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND
				],
				categories: interactiveCategories
			});

		} else {
			registerForPushNotifications();
		}

	});
};

/**
 * Deactivate completely the notifications
 * Per Apple's documentation, it is rarely necessary to call this method.
 * For example, calling this method would be required if a new version of your application no longer supports push notifications.
 */
exports.deactivate = function() {
	exports.PushModule.unregisterForPushNotifications();
};

/**
 * The main method: It activate the notifications (asking to the user the permissions), and sends the device token to your driver.
 * @param {String} 	[channel] 		Channel name
 * @param {Object} 	[data] 			Additional data to pass to the driver
 * @param {Object} 	[opt] 			Additional options to pass to the driver
 * @return {Q.Promise}
 */
exports.subscribe = function(channel, data, opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function(_resolve, _reject) {

		var resolve = function(e) {
			Ti.API.debug(MODULE_NAME + ': subscription success', e);
			exports.trigger('subscription.success', e);
			opt.success(e);
			_resolve(e);
		};

		var reject = function(e) {
			Ti.API.error(MODULE_NAME + ': subscription error', e);
			exports.trigger('subscription.error', e);
			opt.error(e);
			_reject(e);
		};

		if (false == Ti.Network.online) {
			return reject({
				offline: true
			});
		}

		exports.activate()
		.then(function(deviceToken) {

			var driver = exports.loadDriver(exports.config.driver);

			driver.subscribe(_.extend({}, opt, {
				deviceToken: deviceToken,
				channel: channel,
				data: data,
				success: resolve,
				error: reject
			}));

		})
		.fail(reject);

	});
};

/**
 * Unsubscribe from a channel using the specified driver.
 * @param {String} 	[channel] 		Channel name
 * @param {Object} 	[data] 			Additional data to pass to the driver
 * @param {Object} 	[opt] 			Additional options to pass to the driver
 * @return {Q.Promise}
 */
exports.unsubscribe = function(channel, data, opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function(_resolve, _reject) {

		var resolve = function(e) {
			Ti.API.debug(MODULE_NAME + ': unsubscription success', e);
			exports.trigger('unsubscription.success', e);
			opt.success(e);
			_resolve(e);
		};

		var reject = function(e) {
			Ti.API.error(MODULE_NAME + ': unsubscription error', e);
			exports.trigger('unsubscription.error', e);
			opt.error(e);
			_reject(e);
		};

		if (false == Ti.Network.online) {
			return reject({
				offline: true
			});
		}

		var driver = exports.loadDriver(exports.config.driver);
		var device_token = exports.getRemoteDeviceUUID();

		driver.unsubscribe(_.extend({}, opt, {
			deviceToken: device_token,
			channel: channel,
			data: data,
			success: resolve,
			error: reject
		}));

	});
};

/**
 * Set the application badge number
 * @param {Number} 	value
 */
exports.setBadge = function(value) {
	var proxy = OS_IOS ? Ti.UI.iOS : exports.PushModule;
	proxy.setAppBadge(Math.max(value, 0));
};

/**
 * Get the application badge number
 * @return {Number}
 */
exports.getBadge = function() {
	var proxy = OS_IOS ? Ti.UI.iOS : exports.PushModule;
	return proxy.getAppBadge();
};

/**
 * Set the application badge to zero
 */
exports.resetBadge = function() {
	exports.setBadge(0);
};

/**
 * Increment the badge app
 * @param {Number} value 	The value to increment
 */
exports.incBadge = function(value) {
	exports.setBadge(exports.getBadge() + value);
};

/**
 * Get the stored device token.
 * Don't rely on this method to check if notifications are active, use {@link #isRemoteNotificationsEnabled} instead
 * @return {String}
 */
exports.getRemoteDeviceUUID = function() {
	if (exports.config.fakeRemoteDeviceUUID) {
		Ti.API.warn(MODULE_NAME + ': getRemoteDeviceUUID is returning a fake device token');
		return exports.config.fakeRemoteDeviceUUID;
	}

	return exports.PushModule.remoteDeviceUUID;
};

/**
 * Check if the remote notifications has been registered once.
 * Use this method at startup in conjunction with `activate()`
 * @return {Boolean} [description]
 */
exports.isRemoteNotificationsEnabled = function() {
	return exports.PushModule.remoteNotificationsEnabled;
};


///////////////////////////////
// Interactive notifications //
///////////////////////////////

// Create a UserNotificationAction Object based on a dictionary.
function createIntNotifAction(opt) {
	if (opt.id == null) throw new Error(MODULE_NAME + ': interactive notifications must have and ID');
	if (opt.title == null) throw new Error(MODULE_NAME + ': interactive notifications must have a title');

	return Ti.App.iOS.createUserNotificationAction({
		identifier: opt.id,
		title: opt.title,
		activationMode: Ti.App.iOS["USER_NOTIFICATION_ACTIVATION_MODE_" + (opt.openApplication == true ? "FOREGROUND" : "BACKGROUND")],
		destructive: !!opt.destructive,
		authenticationRequired: !!opt.authenticationRequired
	});
}

/**
 * @param {String}   id       	The ID of the category. It must be unique.
 * @param {Array}    dict     	An array of actions. Each action must have defined:
 * `id` (required), the ID of this action
 * `title` (required) the title to show
 * `callback` (required) the callback that handle the user click
 * `openApplication`, `destructive`, `authenticationRequired` are optionals.
 * @param {Function} callback 	The callback to invoke
 */
exports.addInteractiveNotificationCategory = function(id, dict) {
	if (false == INTERACTIVE_NOTIFICATIONS_CAPABLE) {
		Ti.API.error(MODULE_NAME + ': unable to create an interactive notification category, not supported');
		return;
	}

	var category = Ti.App.iOS.createUserNotificationCategory({
		identifier: id,
		actionsForDefaultContext: dict.map(createIntNotifAction)
	});

	// Add in the interactiveCategories array to register in the activate method
	interactiveCategories.push(category);
	interactiveCategoriesCallbacks[ id ] = dict.callback;
};

/**
 * Unmute all notifications
 * @param {Object} data 		Additional data
 */
exports.unmute = function(data) {
	return Q.promise(function(resolve, reject) {

		if (!Ti.Network.online) {
			return reject({
				offline: true
			});
		}

		exports.loadDriver(exports.config.driver).unmute({
			deviceToken: exports.getRemoteDeviceUUID(),
			data: data,
			success: function(response) {
				Event.trigger('notifications.unmute.success');
				defer.resolve(response);
			},
			error: function(err) {
				Event.trigger('notifications.unmute.error');
				defer.reject(err);
			}
		});

	});
};


/**
 * Mute all notifications
 * @param {Object} data 		Additional data
 */
exports.mute = function(data) {
	return Q.promise(function(resolve, reject) {

		if (!Ti.Network.online) {
			return reject({
				offline: true
			});
		}

		exports.loadDriver(exports.config.driver).mute({
			deviceToken: exports.getRemoteDeviceUUID(),
			data: data,
			success: function(response) {
				Event.trigger('notifications.mute.success');
				defer.resolve(response);
			},
			error: function(err) {
				Event.trigger('notifications.mute.error');
				defer.reject(err);
			}
		});

	});
};


//////////
// Init //
//////////

if (INTERACTIVE_NOTIFICATIONS_CAPABLE) {
	Ti.App.iOS.addEventListener('remotenotificationaction', function(e) {
		var func = interactiveCategoriesCallbacks[ e.category ];
		if (_.isFunction(func)) {
			func(e);
		} else {
			Ti.API.error(MODULE_NAME + ': remote notification with an unregistered category (' + e.category + ')');
		}
	});
}

if (exports.config.autoReset === true) {
	exports.resetBadge();
	Ti.App.addEventListener('resumed', exports.resetBadge);
}
