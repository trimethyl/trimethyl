/**
 * @class  Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * HTTP API Driver for Notifications
 */


/**
 * * `subscribeEndpoint`
 * @type {Object}
 */
var config = _.extend({
	subscribeEndpoint: '',

}, Alloy.CFG.T.notifications ? Alloy.CFG.T.notifications.http : {});
exports.config = config;

var HTTP = require('T/http');


/**
 * Send the API request to a Web Server to subscribe
 *
 * @param  {String}   deviceToken 	The device token
 * @param  {String}   [channel]     The channel name
 * @param  {Function} [callback]    The callback
 */
function subscribe(deviceToken, channel, callback) {
	Ti.App.Properties.setString('notifications.token', deviceToken);

	HTTP.send({
		url: config.endpointSubscribe,
		device_token: deviceToken,
		channel: channel || 'none',
		type: (OS_IOS ? 'ios' : (OS_ANDROID ? 'gcm' : ''))
	}, function (e) {
		if (e.success === false) {
			Ti.API.error('Notifications.Cloud: ', e);

			require('T/event').trigger('notifications.subscription.error', e);
			return;
		}

		require('T/event').trigger('notifications.subscription.success', {
			channel: channel
		});
		if (_.isFunction(callback)) callback();
	});
}
exports.subscribe = subscribe;


/**
 * Send the API request to the ACS to unsubscribe from that channel
 *
 * @param  {String} channel
 */
function unsubscribe(channel) {
	var token = Ti.App.Properties.getString('notifications.token');
	if (_.isEmpty(token)) {
		Ti.API.error('Notifications.Cloud: Error while getting notification token in subscribing');
		return;
	}

	Ti.App.Properties.removeProperty('notifications.token');
	Cloud.PushNotifications.unsubscribeToken({
		device_token: token,
		channel: channel || null
	}, function() {
		Ti.API.debug('Notifications.Cloud: Unsubscribing success');
	});
}
exports.unsubscribe = unsubscribe;
