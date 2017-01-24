/**
 * @module  notifications/http
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} config.subscribeEndpoint		URL for subscription
 * @property {String} config.unsubscribeEndpoint	URL for unsubscription
 */
exports.config = _.extend({
	subscribeEndpoint: '/notifications/subscribe',
	unsubscribeEndpoint: '/notifications/unsubscribe',
	unmuteEndpoint: '/notifications/unmute',
	muteEndpoint: '/notifications/mute'
}, (Alloy.CFG.T && Alloy.CFG.T.notifications) ? Alloy.CFG.T.notifications.http : {});

var HTTP = require('T/http');
var Util = require('T/util');

var deploy_type = (Ti.App.deployType === 'production' ? 'production' : 'development');

exports.subscribe = function(opt) {
	if (exports.config.subscribeEndpoint == null) {
		throw new Error("Notifications.HTTP: Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.subscribeEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			channel: opt.channel,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Util.getDeployType(),
			os: Util.getOS(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		errorAlert: false,
		silent: true
	});
};

exports.unsubscribe = function(opt) {
	if (exports.config.unsubscribeEndpoint == null) {
		throw new Error("Notifications.HTTP: Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.unsubscribeEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			channel: opt.channel,
			app_deploytype: Util.getDeployType(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		errorAlert: false,
		silent: true
	});
};

exports.unmute = function(opt) {
	if (exports.config.unmuteEndpoint == null) {
		throw new Error("Notifications.HTTP: Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.unmuteEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Util.getDeployType(),
			os: Util.getOS(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		errorAlert: false,
		silent: true
	});
};

exports.mute = function(opt) {
	if (exports.config.muteEndpoint == null) {
		throw new Error("Notifications.HTTP: Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.muteEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Util.getDeployType(),
			os: Util.getOS(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		errorAlert: false,
		silent: true
	});
};
