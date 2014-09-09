/**
 * @class  Notifications
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Handle notifications system for both platform
 */


/**
 * * **autoReset**: Check if auto-reset the badge when app is open.
 * * **driver**: The driver to use. Possible value are `cloud`.
 * @type {Object}
 */
var config = _.extend({
	autoReset: true,
	driver: 'cloud',
}, Alloy.CFG.T.notifications);
exports.config = config;


function loadDriver(driver) {
	return require('T/notifications.'+driver);
}

var inBackground = false;
function onNotificationReceived(e) {
	if (OS_ANDROID) {

		// Android trigger two types of callback
		// When the app is in background, the type is !== 'callback'
		// So, we simply save the state inBackground and return because the notification.received
		// event must NOT be triggered
		if (e.type!=='callback') {
			inBackground = true;
			return;
		}

		if (e.payload) {

			// Do this to balance the difference in APIs (convert Android to IOS, in substance)
			e.data = T('util').parseJSON(e.payload) || {};
			if (e.data.android) {
				e.data = _.extend(e.data, e.data.android);
				delete e.data.android;
			}

			// Set the property inBackground from the last state
			// and reset to false to prevent double events (simple semaphore)
			e.inBackground = inBackground;
			inBackground = false;
		}
	}

	// Trigger the glob event
	Ti.App.fireEvent('notifications.received', e || {});

	if (config.autoReset) resetBadge();
}


var subscribeFunction;
var unsubscribeFunction;

if (OS_IOS) {

	subscribeFunction = function(cb) {
		Ti.Network.registerForPushNotifications({
			callback: onNotificationReceived,
			types: [ Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND ],
			success: function(e){
				if (!e.deviceToken) {
					Ti.API.error("Notifications: Subscribing - Unable to get device token; "+e.error);
					Ti.App.fireEvent('notifications.subscription.error', e);
					return;
				}

				cb(e.deviceToken);

			},
			error: function(e){
				Ti.API.error("Notifications: Subscribing - "+e.error);
				Ti.App.fireEvent('notifications.subscription.error', e);
			},
		});
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

	subscribeFunction = function(cb) {

		// add a series of callback on the same functions, and set values inset
		CloudPush.addEventListener('callback', onNotificationReceived);
		CloudPush.addEventListener('trayClickLaunchedApp', onNotificationReceived);
		CloudPush.addEventListener('trayClickFocusedApp', onNotificationReceived);

		CloudPush.retrieveDeviceToken({
			success: function(e) {
				if (!e.deviceToken) {
					Ti.API.error("Notifications: Retrieve device token success but invalid - "+e.error);
					Ti.App.fireEvent('notifications.subscription.error', e);
					return;
				}

				cb(e.deviceToken);
			},
			error: function(e) {
				Ti.API.error("Notifications: Retrieve device token failed - "+e.error);
				Ti.App.fireEvent('notifications.subscription.error', e);
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
	if (!subscribeFunction)	{
		Ti.API.error("Notifications: No subscribe function is defined");
		return;
	}

	Ti.API.debug("Notifications: Subscribing to push notifications...");

	subscribeFunction(function(token){
		Ti.API.debug("Notifications: Subscribed, device token is "+token);

		var driver = loadDriver(config.driver);
		if (driver && driver.subscribe) {
			driver.subscribe(token, channel, function(){
				Ti.API.debug("Notifications: Subscribed to selected driver ("+config.driver+')');
			});
		} else {
			Ti.API.error("Notifications: No subscribe method for selected driver ("+config.driver+")");
		}

	});

}
exports.subscribe = subscribe;


/**
 * Unsubscribe for that channel
 * @param  {String} channel Channel name
 */
function unsubscribe(channel) {
	if (!unsubscribeFunction)	{
		Ti.API.error("Notifications: No unsubscribe function is defined");
		return;
	}

	var driver = loadDriver(config.driver);
	if (driver && driver.unsubscribe) {
		driver.unsubscribe(channel);
	} else {
		Ti.API.error("Notifications: No unsubscribe method for selected driver ("+config.driver+")");
	}
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
	setBadge(getBadge()+i);
}
exports.incBadge = incBadge;


(function init(){

	if (config.autoReset) {
		resetBadge();
		Ti.App.addEventListener('resumed', resetBadge);
	}

})();
