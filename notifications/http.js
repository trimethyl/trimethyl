/**
 * @class  Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} config.endpoint 					URL for subscription
 * @property {Object} config.subscribeDataExtend 	Additional data for subscribe.
 * @property {String} config.secret 					Application secret.
 */
exports.config = _.extend({
	endpoint: null,
	secret: null,
	subscribeDataExtend: null,
}, (Alloy.CFG.T && Alloy.CFG.T.notifications) ? Alloy.CFG.T.notifications.http : {});

var HTTP = require('T/http');

exports.subscribe = function(opt) {
	HTTP.send({
		url: exports.config.endpoint,
		method: 'POST',
		data: _.extend({
			device_token: opt.deviceToken,
			channel_id: opt.channel,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Ti.App.deployType,
			app_secret: exports.config.secret,
			os: (function() {
				if (OS_IOS) return 1;
				if (OS_ANDROID) return 2;
			})(),
		}, exports.config.subscribeDataExtend),
		success: opt.success,
		error: opt.error
	});
};

exports.unsubscribe = function(opt) {
	HTTP.send({
		url: exports.config.endpoint + '/' + opt.deviceToken,
		method: 'DELETE',
		data: {
			channel_id: opt.channel,
			app_id: Ti.App.id,
			app_secret: exports.config.secret,
		},
		success: opt.success,
		error: opt.error
	});
};