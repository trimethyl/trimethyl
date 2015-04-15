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
	driver: 'cloud',
}, Alloy.CFG.T ? Alloy.CFG.T.notifications : {});

var Event = require('T/event');
var Util = require('T/util');
var Router = require('T/router');
var Q = require('T/ext/q');

var wasInBackground = false;

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

function onNotificationReceived(e) {
	e = e || {};
	Ti.API.debug("Notifications: Received", e);

	if (OS_ANDROID) {
		// When the app is in background, the type is !== 'callback'
		// So, we simply save the state wasInBackground and return because the notification.received event must NOT be triggered
		if (e.type === 'trayClickLaunchedApp') {
			wasInBackground = true;
			return;
		}

		// Reformat in iOS style
		if (e.payload != null) {
			e.data = Util.parseJSON(e.payload);
			_.extend(e.data, e.data.android);
		}

		e.inBackground = wasInBackground;
		wasInBackground = false;
	}

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
 * @method event
 */
exports.event = function(name, cb) {
	Event.on('notifications.'+name, cb);
};


/**
 * @method activate
 * @param  {Function} callback Callback invoked when success occur
 */
if (OS_IOS) {

	exports.activate = function() {
		var defer = Q.defer();

		if (Util.getIOSVersion() >= 8) {

			var userNotificationsCallback = function(settings) {
				Ti.App.iOS.removeEventListener('usernotificationsettings', userNotificationsCallback);

				if (_.isEmpty(settings.types)) {
					Ti.API.error('Notifications: User has disabled notifications from settings');

					defer.reject({ servicesDisabled: true })
					Event.trigger('notifications.disabled');
					return;
				}

				Ti.Network.registerForPushNotifications({
					callback: onNotificationReceived,
					success: function(e) {
						Ti.API.debug('Notifications: Device token is <' + e.deviceToken + '>');

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
					Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
					Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
					Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
				]
			});

		} else {

			Ti.Network.registerForPushNotifications({
				callback: onNotificationReceived,
				types: [
					Ti.Network.NOTIFICATION_TYPE_BADGE,
					Ti.Network.NOTIFICATION_TYPE_ALERT,
					Ti.Network.NOTIFICATION_TYPE_SOUND
				],
				success: function(e) {
					if (e.deviceToken == null) {
						Ti.API.error('Notifications: Retrieve device token failed (empty)', err);
						defer.reject(err);
						return;
					}

					Ti.API.debug('Notifications: Device token is <' + e.deviceToken + '>');

					defer.resolve(e.deviceToken);
					Event.trigger('notifications.activation.success');
				},
				error: function(err) {
					Ti.API.error('Notifications: Retrieve device token failed', err);

					defer.reject(err);
					Event.trigger('notifications.activation.error', err);
				},
			});
		}

		return defer.promise;
	};

} else if (OS_ANDROID) {

	var CloudPush = require('ti.cloudpush');
	CloudPush.debug = !ENV_PRODUCTION;
	CloudPush.showAppOnTrayClick = true;
	CloudPush.showTrayNotification = true;
	CloudPush.showTrayNotificationsWhenFocused = true;

	exports.activate = function() {
		var defer = Q.defer();

		// add a series of callback on the same functions, and set values inset
		CloudPush.addEventListener('trayClickLaunchedApp', onNotificationReceived);
		CloudPush.addEventListener('trayClickFocusedApp', onNotificationReceived);
		// After the others
		CloudPush.addEventListener('callback', onNotificationReceived);

		CloudPush.retrieveDeviceToken({
			success: function(e) {
				if (e.deviceToken == null) {
					Ti.API.error('Notifications: Retrieve device token failed (empty)', err);
					defer.reject(err);
					return;
				}

				Ti.API.debug('Notifications: Device token is <' + e.deviceToken + '>');

				defer.resolve(e.deviceToken);
				Event.trigger('notifications.activation.success');
			},
			error: function(err) {
				Ti.API.error('Notifications: Retrieve device token failed', err);

				defer.reject(err);
				Event.trigger('notifications.activation.error', err);
			}
		});

		return defer.promise;
	};

}


/**
 * @method deactivate
 * Deactivate completely the notifications
 */
exports.deactivate = function() {
	Ti.App.Properties.removeProperty('notifications.token');

	if (OS_IOS) {
		Ti.Network.unregisterForPushNotifications();
	} else {
		CloudPush.removeEventListener('trayClickLaunchedApp', onNotificationReceived);
		CloudPush.removeEventListener('trayClickFocusedApp', onNotificationReceived);
		CloudPush.removeEventListener('callback', onNotificationReceived);
	}
};

/**
 * @method subscribe
 * Subscribe for that channel
 * @param {String} channel 	Channel name
 * @param {Object} data 		Additional data
 */
exports.subscribe = function(channel, data) {
	var defer = Q.defer();

	exports.activate()
	.fail(defer.reject)
	.then(function(deviceToken) {
		Ti.App.Properties.setString('notifications.token', deviceToken);

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

	});

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
	if (OS_IOS) {
		Ti.UI.iPhone.setAppBadge(Math.max(x,0));
	} else if (OS_ANDROID) {
		// TODO
	}
};

/**
 * @method getBadge
 * Get the App badge value
 * @return {Number}
 */
exports.getBadge = function() {
	if (OS_IOS) {
		return Ti.UI.iPhone.getAppBadge();
	} else if (OS_ANDROID) {
		// TODO
	}
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
	return Ti.App.Properties.hasProperty('notifications.token') ? Ti.App.Properties.getString('notifications.token') : null;
};

/**
 * @method isAuthorized
 * Check if the notifications system is active and the user has given permissions.
 * @return {Boolean} [description]
 */
exports.isAuthorized = function() {
	if (OS_ANDROID) return true;

	if (OS_IOS && Util.getIOSVersion() >= 8) {
		return !_.isEmpty(Ti.App.iOS.currentUserNotificationSettings.types);
	}

	return true;
};

/*
Init
*/

if (exports.config.autoReset === true) {
	exports.resetBadge();
	Ti.App.addEventListener('resumed', exports.resetBadge);
}
