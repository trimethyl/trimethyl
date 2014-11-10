/**
 * @class  Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} config.endpoint 					URL for subscription
 */
exports.config = _.extend({
	endpoint: null,
}, (Alloy.CFG.T && Alloy.CFG.T.notifications) ? Alloy.CFG.T.notifications.http : {});

var HTTP = require('T/http');

exports.subscribe = function(opt) {
	HTTP.send({
		url: exports.config.endpoint,
		method: 'POST',
		data: {
			device_token: opt.deviceToken,
			channel: opt.channel,
			app_version: Ti.App.version,
			app_deploytype: Ti.App.deployType,
			os: (function() {
				if (OS_IOS) return 1;
				if (OS_ANDROID) return 2;
			})(),
		},
		success: opt.success,
		error: opt.error,
		errorAlert: false
	});
};

exports.unsubscribe = function(opt) {
	HTTP.send({
		url: exports.config.endpoint + '/' + opt.deviceToken,
		method: 'DELETE',
		data: {
			device_token: opt.deviceToken,
			channel: opt.channel,
		},
		success: opt.success,
		error: opt.error,
		errorAlert: false
	});
};