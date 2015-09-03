/**
 * @class  	Notifications
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} 	[config.autoReset=true] 	Check if auto-reset the badge when app is open.
 * @property {String} 	[config.driver="http"] 		The driver to use.
 * @property {Boolean} 	[config.useRouter=true]		When a notification with a `{url:""}` parameter is received, auto-route using the Router class.
 * @type {Object}
 */
exports.config = _.extend({
	autoReset: true,
	useRouter: true,
	driver: 'http',
}, Alloy.CFG.T ? Alloy.CFG.T.notifications : {});

var Event = require('T/event');
var Util = require('T/util');
var Router = require('T/router');
var Q = require('T/ext/q');

var interactiveCategories = [];
var interactiveCategoriesCallbacks = {};

function validateToken(token) {
	return token != null && token != "undefined" && token != "null" && token.length >= 32;
}

function onNotificationReceived(e) {
	Ti.API.debug("Notifications: Received", e);

	// Auto-reset the badge
	if (exports.config.autoReset === true) {
		exports.resetBadge();
	}

	// Router
	if (exports.config.useRouter === true) {
		if (e.inBackground == true) {
			if (e.data.url != null) {
				Router.go(e.data.url);
			}
		}
	}

	Event.trigger('notifications.received', e);
}


/**
 * @method loadDriver
 */
exports.loadDriver = function(name) {
	return Alloy.Globals.Trimethyl.loadDriver('notifications', name, {
		subscribe: function(opt) {},
		unsubscribe: function(opt) {}
	});
};


/**
 * @method event
 */
exports.event = function(name, cb) {
	Event.on('notifications.' + name, cb);
};


/**
 * @method activate
 * @param  {Function} callback Callback invoked when success occur
 */
exports.activate = function(callback) {
	var defer = Q.defer();

	if (OS_IOS && Util.getIOSVersion() >= 8) {

		var userNotificationsCallback = function(settings) {
			Ti.App.iOS.removeEventListener('usernotificationsettings', userNotificationsCallback);

			if (_.isEmpty(settings.types)) {
				return defer.reject({
					disabled: true
				});
			}

			Ti.Network.registerForPushNotifications({

				callback: onNotificationReceived,

				success: function(e) {
					if ( ! validateToken(e.deviceToken)) {
						Ti.API.error('Notifications: Retrieve device token failed');
						return defer.reject({
							invalidToken: true
						});
					}

					Ti.API.debug('Notifications: Device token is <' + e.deviceToken + '>');

					Ti.App.Properties.setString('notifications.token', e.deviceToken);
					defer.resolve(e.deviceToken);

					Event.trigger('notifications.activation.success');
				},
				error: function(err) {
					Ti.API.error('Notifications: Retrieve device token failed', err);

					defer.reject(err);
					Event.trigger('notifications.activation.error', err);
				}
			});
		};

		Ti.App.iOS.addEventListener('usernotificationsettings', userNotificationsCallback);
		Ti.App.iOS.registerUserNotificationSettings({
			types: [
				Ti.Network.NOTIFICATION_TYPE_BADGE,
				Ti.Network.NOTIFICATION_TYPE_ALERT,
				Ti.Network.NOTIFICATION_TYPE_SOUND
			],
			categories: interactiveCategories
		});

	} else {

		var Module = null;
		var moduleOpt = {};

		if (OS_IOS) {

			Module = Ti.Network;
			moduleOpt.types = [
				Ti.Network.NOTIFICATION_TYPE_BADGE,
				Ti.Network.NOTIFICATION_TYPE_ALERT,
				Ti.Network.NOTIFICATION_TYPE_SOUND
			];

		} else if (OS_ANDROID) {

			Module = require('it.caffeina.gcm');
			moduleOpt.senderId = Ti.App.Properties.getString('gcm.senderid');

		} else return;

		Module.registerForPushNotifications(_.extend(moduleOpt, {

			callback: onNotificationReceived,

			success: function(e) {
				if ( ! validateToken(e.deviceToken)) {
					Ti.API.error('Notifications: Retrieve device token failed');
					return defer.reject({
						invalidToken: true
					});
				}

				Ti.API.debug('Notifications: Device token is <' + e.deviceToken + '>');

				Ti.App.Properties.setString('notifications.token', e.deviceToken);
				defer.resolve(e.deviceToken);

				Event.trigger('notifications.activation.success');
			},
			error: function(err) {
				Ti.API.error('Notifications: Retrieve device token failed', err);

				defer.reject(err);
				Event.trigger('notifications.activation.error', err);
			},
		}));
	}

	return defer.promise;
};


/**
 * @method deactivate
 * Deactivate completely the notifications
 */
exports.deactivate = function() {
	Ti.App.Properties.removeProperty('notifications.token');

	if (OS_IOS) {
		Module = Ti.Network;
	} else if (OS_ANDROID) {
		Module = require("it.caffeina.gcm");
	} else return;

	Module.unregisterForPushNotifications();
};

/**
 * @method subscribe
 * Subscribe for that channel
 * @param {String} channel 	Channel name
 * @param {Object} data 		Additional data
 */
exports.subscribe = function(channel, data) {
	var defer = Q.defer();

	if (!Ti.Network.online) {
		defer.reject({
			offline: true
		});
		return defer.promise;
	}

	exports.activate()
	.then(function(deviceToken) {

		exports.loadDriver(exports.config.driver).subscribe({
			deviceToken: deviceToken,
			channel: channel,
			data: data,
			success: function(response) {
				Event.trigger('notifications.subscription.success', { channel: channel });
				Ti.API.debug('Notifications: Subscription to channel <' + (channel || 'default') + '> succeded', response);

				defer.resolve(response);
			},
			error: function(err) {
				Event.trigger('notifications.subscription.error', err);
				Ti.API.error('Notifications: Subscription failed to channel <' + (channel || 'default') + '>', err);

				defer.reject(err);
			}
		});

	})
	.fail(defer.reject);

	return defer.promise;
};


/**
 * @method unsubscribe
 * Unsubscribe for that channel
 * @param {String} channel 	Channel name
 * @param {Object} data 		Additional data
 */
exports.unsubscribe = function(channel, data) {
	var defer = Q.defer();

	if (!Ti.Network.online) {
		defer.reject({
			offline: true
		});
		return defer.promise;
	}

	var deviceToken = exports.getStoredDeviceToken();
	if (_.isEmpty(deviceToken)) {
		Ti.API.error('Notifications: Error while getting deviceToken');
		defer.reject({
			missingToken: true
		});

		return defer.promise;
	}

	exports.loadDriver(exports.config.driver).unsubscribe({
		deviceToken: deviceToken,
		channel: channel,
		data: data,
		success: function(response) {
			Event.trigger('notifications.unsubscription.error', { channel: channel });
			Ti.API.debug('Notifications: Unsubscription to channel <' + (channel || 'default') + '> succeded', response);

			defer.resolve(response);
		},
		error: function(err) {
			Event.trigger('notifications.unsubscription.error', err);
			Ti.API.error('Notifications: Unsubscription failed to channel <' + (channel || 'default') + '>', err);

			defer.reject(err);
		}
	});

	return defer.promise;
};


/**
 * @method setBadge
 * Set the App badge value
 * @param {Number} x
 */
exports.setBadge = function(x) {
	var Module = OS_IOS ? Ti.UI.iPhone : require('it.caffeina.gcm');
	Module.setAppBadge(Math.max(x,0));
};

/**
 * @method getBadge
 * Get the App badge value
 * @return {Number}
 */
exports.getBadge = function() {
	var Module = OS_IOS ? Ti.UI.iPhone : require('it.caffeina.gcm');
	return Module.getAppBadge();
};

/**
 * @method resetBadge
 * Reset to 0 the badge
 */
exports.resetBadge = function() {
	exports.setBadge(0);
};

/**
 * @method incBadge
 * Increment the badge app
 * @param  {Number} i The value to increment
 */
exports.incBadge = function(i) {
	exports.setBadge(exports.getBadge() + i);
};

/**
 * @method getStoredDeviceToken
 * Get the stored device token. Don't rely on this method to check if notifications are active.
 * @return {String}
 */
exports.getStoredDeviceToken = function() {
	return Ti.App.Properties.getString('notifications.token', null);
};

/**
 * @method isAuthorized
 * Check if the notifications system is active and the user has given permissions.
 * @return {Boolean} [description]
 */
exports.isAuthorized = function() {
	return true;
};


///////////////////////////////
// Interactive notifications //
///////////////////////////////

function createIntNotifAction(opt) {
	if (opt.id == null) throw new Error('Notifications: interactive notifications must have and ID');
	if (opt.title == null) throw new Error('Notifications: interactive notifications must have a title');

	return Ti.App.iOS.createUserNotificationAction({
		identifier: opt.id,
		title: opt.title,
		activationMode: Ti.App.iOS["USER_NOTIFICATION_ACTIVATION_MODE_" + (opt.openApplication == true ? "FOREGROUND" : "BACKGROUND")],
		destructive: !!opt.destructive,
		authenticationRequired: !!opt.authenticationRequired
	});
}

exports.addInteractiveNotificationCategory = function(id, dict, callback) {
	if (!(OS_IOS && Util.getIOSVersion() >= 8)) return;

	var category = Ti.App.iOS.createUserNotificationCategory({
		identifier: id,
		actionsForDefaultContext: dict.map(createIntNotifAction)
	});

	// Add in the interactiveCategories array to register in the activate method
	interactiveCategories.push(category);
	interactiveCategoriesCallbacks[id] = callback;
};


//////////
// Init //
//////////

if (OS_IOS && Util.getIOSVersion() >= 8) {
	Ti.App.iOS.addEventListener('remotenotificationaction', function(e) {
		var func = interactiveCategoriesCallbacks[e.category];
		if (_.isFunction(func)) {
			func(e);
		} else {
			Ti.API.error('Notifications: remote notification with an unregistered category (' + e.category + ')');
		}
	});
}

if (exports.config.autoReset === true) {
	exports.resetBadge();
	Ti.App.addEventListener('resumed', exports.resetBadge);
}
