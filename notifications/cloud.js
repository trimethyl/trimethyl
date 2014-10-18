/**
 * @class  Notifications.Cloud
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Appcellerator ACS driver for notifications
 *
 * You must set this properties in `tiapp.xml`
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


exports.subscribe = function(opt) {
	Cloud.PushNotifications.subscribeToken({
		device_token: opt.deviceToken,
		channel: opt.channel || 'none',
		type: (function(){
			if (OS_IOS) return 'ios';
			if (OS_ANDROID) return 'gcm';
		})()
	}, function (e) {
		opt[ e.success === true ? 'success' : 'error' ](e);
	});
};

exports.unsubscribe = function(opt) {
	Cloud.PushNotifications.unsubscribeToken({
		device_token: opt.deviceToken,
		channel: opt.channel || 'none'
	}, function(e){
		opt[ e.success === true ? 'success' : 'error' ](e);
	});
};
