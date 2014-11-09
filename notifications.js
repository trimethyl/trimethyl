/**
 * @class  Notifications
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * * `autoReset` Check if auto-reset the badge when app is open.
 * * `driver` The driver to use. Default: `cloud`
 * @type {Object}
 */
var config = _.extend({
	autoReset: true,
	driver: 'cloud',
}, Alloy.CFG.T ? Alloy.CFG.T.notifications : {});
exports.config = config;

var Event = require('T/event');
var Util = require('T/util');

var inBackground = false;

// Driver loader
function load(name) {
	return require( /\//.test(name) ? name : ('T/notifications/'+name) );
}

function onNotificationReceived(e) {
	if (OS_ANDROID) {

		// Android trigger two types of callback
		// When the app is in background, the type is !== 'callback'
		// So, we simply save the state inBackground and return
		// because the notification.received event must NOT be triggered
		if (e.type !== 'callback') {
			inBackground = true;
			return;
		}

		if (e.payload != null) {

			// Do this to balance the difference in APIs (convert Android to IOS, in substance)
			e.data = require('T/util').parseJSON(e.payload);
			if (e.data.android != null) {
				_.extend(e.data, e.data.android);
				delete e.data.android;
			}

			// Set the property inBackground from the last state
			// and reset to false to prevent double events (simple semaphore)
			e.inBackground = inBackground;
			inBackground = false;
		}
	}

	if (config.autoReset === true) {
		exports.resetBadge();
	}

	Event.trigger('notifications.received', e);
}


var subscribeFunction = null;
var unsubscribeFunction = null;

if (OS_IOS) {

	subscribeFunction = function(callback) {
		if (Util.getIOSVersion() >= 8) {

			var tmpSubscribe = function() {
				Ti.App.iOS.removeEventListener('usernotificationsettings', tmpSubscribe);
				Ti.Network.registerForPushNotifications({
					callback: onNotificationReceived,
					success: function(e) { callback(e.deviceToken); },
					error: function(err) {
						Ti.API.error('Notifications: Retrieve device token failed', err);
						Event.trigger('notifications.subscription.error', err);
					}
				});
			};

			Ti.App.iOS.addEventListener('usernotificationsettings',  tmpSubscribe);
			Ti.App.iOS.registerUserNotificationSettings({
				types: [ Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE ]
			});

		} else {

			Ti.Network.registerForPushNotifications({
				callback: onNotificationReceived,
				types: [ Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND ],
				success: function(e) { callback(e.deviceToken); },
				error: function(err) {
					Ti.API.error('Notifications: Retrieve device token failed', err);
					Event.trigger('notifications.subscription.error', err);
				},
			});
		}
	};

	unsubscribeFunction = function(){
		Ti.Network.unregisterForPushNotifications();
	};

} else if (OS_ANDROID) {

	var CloudPush = require('ti.cloudpush');
	CloudPush.debug = !ENV_PRODUCTION;
	CloudPush.singleCallback = true;
	CloudPush.showAppOnTrayClick = true;

	// iOS Style, allow only background system-wide notifications
	CloudPush.showTrayNotification = true;
	CloudPush.showTrayNotificationsWhenFocused = false;

	subscribeFunction = function(callback) {
		// add a series of callback on the same functions, and set values inset
		CloudPush.addEventListener('callback', onNotificationReceived);
		CloudPush.addEventListener('trayClickLaunchedApp', onNotificationReceived);
		CloudPush.addEventListener('trayClickFocusedApp', onNotificationReceived);

		CloudPush.retrieveDeviceToken({
			success: function(e) { callback(e.deviceToken); },
			error: function(e) {
				Ti.API.error('Notifications: Retrieve device token failed', e);
				Event.trigger('notifications.subscription.error', e);
			}
		});
	};

	unsubscribeFunction = function(){
		CloudPush.removeEventListener('callback', onNotificationReceived);
		CloudPush.removeEventListener('trayClickLaunchedApp', onNotificationReceived);
		CloudPush.removeEventListener('trayClickFocusedApp', onNotificationReceived);
	};

}


/**
 * @method subscribe
 * Subscribe for that channel
 * @param  {String} channel Channel name
 */
exports.subscribe = function(channel) {
	subscribeFunction(function(deviceToken) {
		Ti.App.Properties.setString('notifications.token', deviceToken);

		load(config.driver).subscribe({
			deviceToken: deviceToken,
			channel: channel,
			success: function(){
				Event.trigger('notifications.subscription.success', { channel: channel });
				Ti.API.debug('Notifications: Subscription to channel' + channel + ' succeded');
			},
			error: function(err) {
				Event.trigger('notifications.subscription.error', err);
				Ti.API.error('Notifications: Subscription failed to channel' + channel, err);
			}
		});
	});
};


/**
 * @method unsubscribe
 * Unsubscribe for that channel
 * @param  {String} channel Channel name
 */
exports.unsubscribe = function(channel) {
	var deviceToken = Ti.App.Properties.getString('notifications.token');
	if (_.isEmpty(deviceToken)) {
		return Ti.API.error('Notifications: Error while getting devideToken');
	}

	Ti.App.Properties.removeProperty('notifications.token');
	load(config.driver).unsubscribe({
		deviceToken: deviceToken,
		channel: channel,
		success: function(){
			Event.trigger('notifications.unsubscription.error', { channel: channel });
			Ti.API.debug('Notifications: Unsubscription to channel' + channel + ' succeded');
		},
		error: function(err) {
			Event.trigger('notifications.unsubscription.error', err);
			Ti.API.error('Notifications: Unsubscription failed to channel' + channel, err);
		}
	});
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


/*
Init
*/

if (config.autoReset) {
	exports.resetBadge();
	Ti.App.addEventListener('resumed', exports.resetBadge);
}
