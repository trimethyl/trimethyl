/**
 * @class  Notifications.Cloud
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Appcellerator ACS driver for notifications
 *
 * You must set this properties in your TiApp.xml file
 *
 * ```
 * <property name="acs-api-key-development" type="string">...</property>
 * <property name="acs-oauth-key-development" type="string">...</property>
 * <property name="acs-oauth-secret-development" type="string">...</property>
 * <property name="acs-api-key-production" type="string">...</property>
 * <property name="acs-oauth-key-production" type="string">...</property>
 * <property name="acs-oauth-secret-production" type="string">...</property>
 * ```
 *
 */


/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.notifications ? Alloy.CFG.T.notifications.cloud : {});
exports.config = config;


var Cloud = require('ti.cloud');
Cloud.debug = !ENV_PRODUCTION;


/**
 * Send the API request to the ACS to subscribe
 *
 * @param  {String}   deviceToken 	The device token
 * @param  {String}   [channel]     The channel name
 * @param  {Function} [callback]    The callback
 */
function subscribe(deviceToken, channel, callback) {
	Ti.App.Properties.setString('notifications.token', deviceToken);

	Cloud.PushNotifications.subscribeToken({
		device_token: deviceToken,
		channel: channel || 'none',
		type: (function(){
			if (OS_IOS) return 'ios';
			if (OS_ANDROID) return 'gcm';
		})()
	}, function (e) {
		if (!e.success) {
			Ti.API.error("Notifications.Cloud: "+e.error);
			return Ti.App.fireEvent('notifications.subscription.error', e);
		}

		Ti.App.fireEvent('notifications.subscription.success', { channel: channel });
		if (callback) callback();
	});
}
exports.subscribe = subscribe;


/**
 * Send the API request to the ACS to unsubscribe from that channel
 *
 * @param  {[type]} channel [description]
 * @return {[type]}         [description]
 */
function unsubscribe(channel) {
	var token = Ti.App.Properties.getString('notifications.token');
	if (!token) {
		Ti.API.error("Notifications.Cloud: Error while getting notification token in subscribing");
		return;
	}

	Ti.App.Properties.removeProperty('notifications.token');
	Cloud.PushNotifications.unsubscribeToken({
		device_token: token,
		channel: channel || null
	}, function(){
		Ti.API.debug("Notifications.Cloud: Unsubscribing success");
	});
}
exports.unsubscribe = unsubscribe;
