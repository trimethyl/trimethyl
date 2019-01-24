/**
 * @module  firebase/cloudmessaging/http
 * @author  Flavio De Stefano <flavio.destefano@caffeina.com>
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 * @property {String} config.subscribeEndpoint		URL for subscription
 * @property {String} config.unsubscribeEndpoint	URL for unsubscription
 */
exports.config = _.extend({
	subscribeEndpoint: '/notifications/subscribe',
	unsubscribeEndpoint: '/notifications/unsubscribe',
}, (Alloy.CFG.T && Alloy.CFG.T.firebase && Alloy.CFG.T.firebase.cloudmessaging) ? Alloy.CFG.T.firebase.cloudmessaging.http : {});

var HTTP = require('T/http');
var Util = require('T/util');

var MODULE_NAME = 'firebase/cloudmessaging/http';

/**
 * Subscribe to the push notifications service.
 * @param {Object} 		opt
 * @param {String} 		opt.deviceToken 		The device token.
 * @param {String} 		[opt.topic] 			An optional topic to subscribe to.
 * @param {Function} 	[opt.success] 			The success callback.
 * @param {Function} 	[opt.error] 			The error callback.
 * @param {Boolean} 	[opt.suppressFilters] 	Optionally suppress any filter added to the T/HTTP module.
 */
exports.subscribe = function(opt) {
	if (exports.config.subscribeEndpoint == null) {
		throw new Error(MODULE_NAME + ": Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.subscribeEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			channel: opt.topic,
			app_id: Ti.App.id,
			app_version: Ti.App.version,
			app_deploytype: Util.getDeployType(),
			os: Util.getOS(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		silent: true
	});
};

/**
 * Unsubscribe from the push notifications service.
 * @param {Object} 		opt
 * @param {String} 		opt.deviceToken 		The device token.
 * @param {String} 		[opt.topic] 			An optional topic to unsubscribe from.
 * @param {Function} 	[opt.success] 			The success callback.
 * @param {Function} 	[opt.error] 			The error callback.
 * @param {Boolean} 	[opt.suppressFilters] 	Optionally suppress any filter added to the T/HTTP module.
 */
exports.unsubscribe = function(opt) {
	if (exports.config.unsubscribeEndpoint == null) {
		throw new Error(MODULE_NAME + ": Invalid HTTP endpoint");
	}

	HTTP.send({
		url: exports.config.unsubscribeEndpoint,
		method: 'POST',
		data: _.extend({}, opt.data, {
			device_token: opt.deviceToken,
			channel: opt.topic,
			app_deploytype: Util.getDeployType(),
		}),
		success: opt.success,
		error: opt.error,
		suppressFilters: opt.suppressFilters,
		silent: true
	});
};
