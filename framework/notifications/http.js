/**
 * @class  	Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} config.subscribeEndpoint		URL for subscription
 * @property {String} config.unsubscribeEndpoint	URL for unsubscription
 */
exports.config = _.extend({
	subscribeEndpoint: '/notifications/subscribe',
	unsubscribeEndpoint: '/notifications/unsubscribe'
}, (Alloy.CFG.T && Alloy.CFG.T.notifications) ? Alloy.CFG.T.notifications.http : {});

var HTTP = require('T/http');

exports.subscribe = function(opt) {
	HTTP.send({
		url: exports.config.subscribeEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			channel: opt.channel,
			app_version: Ti.App.version,
			app_deploytype: (Ti.App.deployType === 'production' ? 'production' : 'development'),
			os: (function() {
				if (OS_IOS) return 1;
				if (OS_ANDROID) return 2;
			})(),
		}),
		success: opt.success,
		error: opt.error,
		errorAlert: false,
		silent: true
	});
};

exports.unsubscribe = function(opt) {
	HTTP.send({
		url: exports.config.unsubscribeEndpoint + '/' + opt.deviceToken,
		method: 'POST',
		data: _.extend({}, opt.data, {
			channel: opt.channel,
		}),
		success: opt.success,
		error: opt.error,
		errorAlert: false,
		silent: true
	});
};