/**
 * @class  	Notifications.Cloud
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


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
