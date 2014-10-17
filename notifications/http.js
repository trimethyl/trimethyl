/**
 * @class  Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * HTTP API Driver for Notifications
 */


/**
 * * `subscribeURL` URL for subscription. Type `String`. Default `null`
 * * `unsubscribeUrl` URL for unsubscription. Type `String`. Default `null`
 * * `subscribeDataExtend` Additional data to extend for subscribe. Type `Object`. Default `null`
 * @type {Object}
 */
var config = _.extend({
	subscribeURL: null,
	unsubscribeURL: null,
	subscribeDataExtend: null,
}, Alloy.CFG.T.notifications ? Alloy.CFG.T.notifications.http : {});
exports.config = config;

var HTTP = require('T/http');
var Event = require('T/event');


/**
 * Send the API request to a Web Server to subscribe
 *
 * @param  {String}   deviceToken 	The device token
 * @param  {Number}   [channel]     The channel ID
 * @param  {Function} [callback]    The callback
 */
function subscribe(deviceToken, channel, callback) {
	Ti.App.Properties.setString('notifications.token', deviceToken);

	HTTP.send({
		url: config.subscribeURL,
		method: 'POST',
		data: _.extend({
			device_token: deviceToken,
			channel_id: channel,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Ti.App.deployType,
			os: (function() {
				if (OS_IOS) return 1;
				if (OS_ANDROID) return 2;
			})(),
		}, config.subscribeDataExtend),
		success: function() {
			Event.trigger('notifications.subscription.success', { channel: channel });
			if (_.isFunction(callback)) callback();
		},
		error: function(err) {
			Event.trigger('notifications.subscription.error', err);
		}
	});
}
exports.subscribe = subscribe;


/**
 * Send the API request to a Web Server
 * to unsubscribe from that channel
 *
 * @param  {String} [channel]
 */
function unsubscribe(channel) {
	var token = Ti.App.Properties.getString('notifications.token');
	if (_.isEmpty(token)) {
		Ti.API.error('Notifications.HTTP: Error while getting notification token in subscribing');
		return;
	}

	Ti.App.Properties.removeProperty('notifications.token');
	HTTP.send({
		url: config.unsubscribeURL,
		method: 'POST',
		data: {
			device_token: token,
			channel_id: channel,
			app_id: Ti.App.id,
		},
	});
}
exports.unsubscribe = unsubscribe;
