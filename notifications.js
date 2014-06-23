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
}, Alloy.CFG.notifications);
exports.config = config;


function getDriver(driver) {
	return require('T/notifications.' + (driver||config.driver) );
}


function onNotificationReceived(e) {
	Ti.App.fireEvent('notifications.received', e);
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
	CloudPush.enabled = true;

	subscribeFunction = function(cb) {
		CloudPush.addEventListener('callback', onNotificationReceived);
		CloudPush.retrieveDeviceToken({
			success: function(e) {
				if (!e.deviceToken) {
					Ti.API.error("Notifications: Retrieve device token success but invalid - "+e.error);
					Ti.App.fireEvent('notifications.subscription.error', e);
					return;
				}

				CloudPush.enabled = true;
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
		CloudPush.enabled = false;
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

		var driver = getDriver();
		if (driver) {
			driver.subscribe(token, channel, function(){
				Ti.API.debug("Notifications: Subscribed to selected driver ("+config.driver+')');
			});
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

	var driver = getDriver();
	if (driver) driver.unsubscribe(channel);
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
