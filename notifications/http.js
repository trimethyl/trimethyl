/**
 * @class  Notifications.HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * * `endpoint` URL for subscription. Type `String`. Default `null`
 * * `subscribeDataExtend` Additional data to extend for subscribe. Type `Object`. Default `null`
 * @type {Object}
 */
var config = _.extend({
	endpoint: null,
	subscribeDataExtend: null,
}, (Alloy.CFG.T && Alloy.CFG.T.notifications) ? Alloy.CFG.T.notifications.http : {});
exports.config = config;

var HTTP = require('T/http');


exports.subscribe = function(opt) {
	HTTP.send({
		url: config.endpoint,
		method: 'POST',
		data: _.extend({
			device_token: opt.deviceToken,
			channel_id: opt.channel,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Ti.App.deployType,
			os: (function() {
				if (OS_IOS) return 1;
				if (OS_ANDROID) return 2;
			})(),
		}, config.subscribeDataExtend),
		success: opt.success,
		error: opt.error
	});
};

exports.unsubscribe = function(opt) {
	HTTP.send({
		url: config.endpoint,
		method: 'DELETE',
		data: {
			device_token: opt.deviceToken,
			channel_id: opt.channel,
			app_id: Ti.App.id,
		},
		success: opt.success,
		error: opt.error
	});
};