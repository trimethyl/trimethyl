/**
 * @module  firebase/cloudmessaging
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

/*
Include methods used in this module dynamically to avoid that Titanium
static analysis doesn't include native-language methods.
 */
Ti.Network;
Ti.Network.registerForPushNotifications;

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 * @property {String} 	[config.driver="http"] 					The driver to use.
 * @property {Boolean} 	[config.autoReset=true] 				If true, set the badge count to 0 when you open/resume the application.
 * @property {Boolean}  [config.fakeDeviceToken=false] 	A fake device token.
 * @type {Object}
 */
exports.config = _.extend({
	driver: 'http',
	autoReset: true,
	fakeDeviceToken: false
}, (Alloy.CFG.T && Alloy.CFG.T.firebase) ? Alloy.CFG.T.firebase.cloudmessaging : {});

var MODULE_NAME = 'firebase/cloudmessaging';

var Event = require('T/event');
var Q = require('T/ext/q');
require('T/firebase/core');
var FCM = require('firebase.cloudmessaging');

var registered_for_push_notifications = false;

// The listeners for all received notification
function notificationsCallback(e) {

	// TODO check data structure on Android and iOS
	Ti.API.warn('NOTIFICATION', e);

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

/**
 * @property onReceived
 * A callback called when a notification is received.
 * You can override this to handle incoming notifications, or just
 * listen to the global event "notifications.received"
 */
exports.onReceived = function (e) {
	Ti.API.info(MODULE_NAME + ': Received', e);
};

/**
 * Load a driver of current module
 */
exports.loadDriver = function (name) {
	return Alloy.Globals.Trimethyl.loadDriver(MODULE_NAME, name, {
		subscribe: function (opt) { },
		unsubscribe: function (opt) { }
	});
};

/**
 * Attach events to current module
 * @param {String} 		name 	Event key
 * @param {Function} 	cb 		Callback
 */
exports.on = exports.event = function (name, cb) {
	Event.on(MODULE_NAME + '.' + name, cb);
};

/**
 * Remove events to current module
 * @param {String} 	name 	Event key
 * @param {Function} 	cb 		Callback
 */
exports.off = function (name, cb) {
	Event.off(MODULE_NAME + '.' + name, cb);
};

/**
 * Trigger events from current module
 * @param {String} 		name 	Event key
 * @param {Function} 	cb 		The data
 */
exports.trigger = function (name, data) {
	Event.trigger(MODULE_NAME + '.' + name, data);
};

/**
 * Activate the notifications without a subscription to a service.
 * You can use this method to just ask to the user the permissions.
 * @param {Object} 		[opt]
 * @param {Function} 	[opt.success] 	Callback to invoke on success
 * @param {Function} 	[opt.error] 	Callback to invoke on error
 * @return {Q.Promise}
 */
exports.activate = function (opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function (_resolve, _reject) {

		var resolve = function (e) {
			Ti.API.debug(MODULE_NAME + ': activation success', e);
			exports.trigger('activation.success', e);
			opt.success(e);
			_resolve(e);
		};

		var reject = function (e) {
			Ti.API.error(MODULE_NAME + ': activation error', e);
			exports.trigger('activation.error', e);
			opt.error(e);
			_reject(e);
		};

		if (exports.config.fakeDeviceToken) {
			Ti.API.warn(MODULE_NAME + ': faking activation');
			resolve(exports.config.fakeDeviceToken);
			return;
		}

		var registerForPushNotifications = function () {
			if (registered_for_push_notifications) {
				resolve(exports.getDeviceToken());
			} else {
				if (OS_IOS) {
					Ti.Network.registerForPushNotifications({
						success: function(e) {
							registered_for_push_notifications = true;
							resolve(exports.getDeviceToken());
						},
						error: reject,
						callback: notificationsCallback,
						types: [
							Ti.Network.NOTIFICATION_TYPE_BADGE,
							Ti.Network.NOTIFICATION_TYPE_ALERT,
							Ti.Network.NOTIFICATION_TYPE_SOUND,
						],
					});
				} else if (OS_ANDROID) {
					// TODO see if we need parameters here
					FCM.createNotificationChannel(/*{
						sound: 'warn_sound',
						channelId: 'general',
						channelName: 'General Notifications', // TODO get from strings
						importance: 'high' //will pop in from the top and make a sound
					}*/);
					// TODO listeners
					FCM.registerForPushNotifications();
				} else {
					reject(Error("platform not supported"));
				}
			}
		};

		if (OS_IOS) {

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
 * Activate the notifications (asking the user for permissions), and send the device token to your driver.
 * @param {String} 		[topic] 	Topic name
 * @param {Object} 		[data] 		Additional data to pass to the driver
 * @param {Object} 		[opt] 		Additional options to pass to the driver
 * @return {Q.Promise}
 */
exports.subscribe = function (topic, data, opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function (_resolve, _reject) {
		var resolve = function (e) {
			Ti.API.debug(MODULE_NAME + ': subscription success', e);
			exports.trigger('subscription.success', e);
			opt.success(e);
			_resolve(e);
		};

		var reject = function (e) {
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
				// TODO use driver only if defined, use subscribeToTopic otherwise
				var driver = exports.loadDriver(exports.config.driver);

				driver.subscribe(_.extend({}, opt, {
					deviceToken: deviceToken,
					topic: topic,
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
 * @param {String} 		[topic] 		Topic name
 * @param {Object} 		[data] 			Additional data to pass to the driver
 * @param {Object} 		[opt] 			Additional options to pass to the driver
 * @return {Q.Promise}
 */
exports.unsubscribe = function (topic, data, opt) {
	opt = _.defaults(opt || {}, {
		success: Alloy.Globals.noop,
		error: Alloy.Globals.noop
	});

	return Q.promise(function (_resolve, _reject) {
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

		// TODO use driver only if defined, use unsubscribeFromTopic otherwise
		var driver = exports.loadDriver(exports.config.driver);
		var device_token = exports.getDeviceToken();

		driver.unsubscribe(_.extend({}, opt, {
			deviceToken: device_token,
			topic: topic,
			data: data,
			success: resolve,
			error: reject
		}));
	});
};

/**
 * **iOS only** Set the application badge number
 * @param {Number} 	value
 */
exports.setBadge = function (value) {
	if (!OS_IOS) return;
	Ti.UI.iOS.setAppBadge(Math.max(value, 0));
};

/**
 * **iOS only** Get the application badge number.
 * @return {Number}
 */
exports.getBadge = function () {
	if (!OS_IOS) return;
	return Ti.UI.iOS.getAppBadge();
};

/**
 * **iOS only** Set the application badge to zero
 */
exports.resetBadge = function () {
	if (!OS_IOS) return;
	exports.setBadge(0);
};

/**
 * **iOS only** Increment the badge app.
 * @param {Number} value 	The value to increment
 */
exports.incBadge = function (value) {
	if (!OS_IOS) return;
	exports.setBadge(exports.getBadge() + value);
};

/**
 * Get the stored device token.
 * Don't rely on this method to check if notifications are active, use {@link #areRemoteNotificationsEnabled} instead
 * @return {String}
 */
exports.getDeviceToken = function () {
	if (exports.config.fakeDeviceToken) {
		Ti.API.warn(MODULE_NAME + ': getDeviceToken is returning a fake device token');
		return exports.config.fakeDeviceToken;
	}

	// TODO could we use only the fcmToken?
	if (OS_IOS) {
		return FCM.apnsToken;
	} else if (OS_ANDROID) {
		return FCM.fcmToken;
	} else {
		Ti.API.error(MODULE_NAME + ': platform not supported.');
		return;
	}
};

/**
 * Check if the remote notifications has been registered once.
 * Use this method at startup in conjunction with `activate()`
 * @return {Boolean}
 */
exports.areRemoteNotificationsEnabled = function () {
	if (OS_IOS) {
		return Ti.Network.remoteNotificationsEnabled;
	} else if (OS_ANDROID) {
		return Ti.Android.NotificationManager.areNotificationsEnabled();
	} else {
		Ti.API.error(MODULE_NAME + ': platform not supported.');
		return false;
	}
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
 * **iOS only**
 * @param {String}   id       	The ID of the category. It must be unique.
 * @param {Array}    dict     	An array of actions. Each action must have defined:
 * `id` (required), the ID of this action
 * `title` (required) the title to show
 * `callback` (required) the callback that handle the user click
 * `openApplication`, `destructive`, `authenticationRequired` are optionals.
 * @param {Function} callback 	The callback to invoke
 */
exports.addInteractiveNotificationCategory = function (id, dict) {
	if (!OS_IOS) {
		Ti.API.error(MODULE_NAME + ': unable to create an interactive notification category: platform not supported');
		return;
	}

	var category = Ti.App.iOS.createUserNotificationCategory({
		identifier: id,
		actionsForDefaultContext: dict.map(createIntNotifAction)
	});

	// Add in the interactiveCategories array to register in the activate method
	interactiveCategories.push(category);
	interactiveCategoriesCallbacks[id] = dict.callback;
};


//////////
// Init //
//////////

if (OS_IOS) {
	Ti.App.iOS.addEventListener('remotenotificationaction', function (e) {
		var func = interactiveCategoriesCallbacks[e.category];
		if (_.isFunction(func)) {
			func(e);
		} else {
			Ti.API.error(MODULE_NAME + ': remote notification with an unregistered category (' + e.category + ')');
		}
	});
}

// Called when direct messages arrive. Note that these are different from push notifications
// TODO check intent and FCM.lastData for notifications
FCM.addEventListener('didReceiveMessage', notificationsCallback);

if (OS_IOS) {
	Ti.App.iOS.addEventListener('notification', notificationsCallback);
	Ti.App.iOS.addEventListener('remotenotificationaction', notificationsCallback);
}

if (exports.config.autoReset === true) {
	exports.resetBadge();
	Ti.App.addEventListener('resumed', exports.resetBadge);
}
