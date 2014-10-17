/**
 * @class  Notifications
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Handle notifications system for both platform
 */


/**
 * * `autoReset` Check if auto-reset the badge when app is open.
 * * `driver` The driver to use. Default: `cloud`
 * @type {Object}
 */
var config = _.extend({
	autoReset: true,
	driver: 'cloud',
}, Alloy.CFG.T.notifications);
exports.config = config;

var Event = require('T/event');
var Util = require('T/util');

var inBackground = false;


/**
 * Require the selected driver
 *
 * @param  {String} driver The driver
 * @return {Object}
 */
function load(driver) {
	return require('T/notifications/'+driver);
}
exports.load = load;


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
		resetBadge();
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
					success: function(e) { callback(e.deviceToken) },
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
			success: function(e) {
				callback(e.deviceToken);
			},
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
 * Subscribe for that channell
 * @param  {String} channel Channel name
 */
function subscribe(channel) {
	subscribeFunction(function(token) {
		load(config.driver).subscribe(token, channel, function(){
			Ti.API.debug('Notifications: Subscription OK with driver ' + config.driver);
		});
	});
}
exports.subscribe = subscribe;


/**
 * Unsubscribe for that channel
 * @param  {String} channel Channel name
 */
function unsubscribe(channel) {
	load(config.driver).unsubscribe(channel);
}
exports.unsubscribe = unsubscribe;


/**
 * Set the App badge value
 * @param {Number} x
 */
function setBadge(x) {
	if (OS_IOS) {
		Ti.UI.iPhone.setAppBadge(Math.max(x,0));
	} else if (OS_ANDROID) {
		// TODO
	}
}
exports.setBadge = setBadge;


/**
 * Get the App badge value
 * @return {Number}
 */
function getBadge() {
	if (OS_IOS) {
		return Ti.UI.iPhone.getAppBadge();
	} else if (OS_ANDROID) {
		// TODO
	}
}
exports.getBadge = getBadge;


function resetBadge() {
	setBadge(0);
}


/**
 * Increment the badge app
 * @param  {Number} i The value to increment
 */
function incBadge(i) {
	setBadge(getBadge() + i);
}
exports.incBadge = incBadge;



/*
Init
*/

if (config.autoReset) {
	resetBadge();
	Ti.App.addEventListener('resumed', resetBadge);
}
