var Cloud = require("ti.cloud");
Cloud.debug = !ENV_PRODUCTION;

if (OS_ANDROID) {
	var CloudPush = require('ti.cloudpush');
	CloudPush.debug = !ENV_PRODUCTION;
	CloudPush.enabled = true;
	CloudPush.addEventListener('callback', notificationReceived);
}

var config = {
	inAppNotification: true,
	inAppNotificationMethod: 'toast',
	autoReset: true
};

function notificationReceived(e) {
	Ti.App.fireEvent('notifications.received', e);
	if (config.autoReset) setBadge(0);
	// Handle foreground notifications
	if (!e.inBackground && e.data.alert) {
		if (config.inAppNotification) {
			if (config.inAppNotificationMethod=='toast') require('toast').show(e.data.alert);
			else if (config.inAppNotificationMethod=='alert') alert(e.data.alert);
		}
	}
}

exports.setBadge = setBadge = function(x) {
	if (OS_IOS) {
		Ti.UI.iPhone.setAppBadge(Math.max(x,0));
	} else if (OS_ANDROID) {
		// TODO
	}
};

exports.getBadge = getBadge = function() {
	if (OS_IOS) {
		return Ti.UI.iPhone.getAppBadge();
	} else if (OS_ANDROID) {
		// TODO
	}
};

exports.incBadge = function(i) {
	setBadge(getBadge()+i);
};

function subscribe(channel, deviceToken, callback) {
	Ti.App.Properties.setString('notifications.token', deviceToken);
	Cloud.PushNotifications.subscribeToken({
		device_token: deviceToken,
		channel: channel || 'none',
		type: (function(){
			if (OS_IOS) return 'ios';
			if (OS_ANDROID) return 'gcm';
		})()
	}, function (e) {
		if (!e.success) {
			return Ti.App.fireEvent('notifications.subscription.error', e);
		}
		Ti.App.fireEvent('notifications.subscription.success', { channel: channel });
		if (callback) callback();
	});
}

function subscribeIOS(cb) {
	Ti.Network.registerForPushNotifications({
		types: [ Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND ],
		success: function(e){
			if (!e.deviceToken) {
				Ti.App.fireEvent('notifications.subscription.error', e);
				return;
			}

			cb(e.deviceToken);
		},
		error: function(e){
			Ti.App.fireEvent('notifications.subscription.error', e);
		},
		callback: notificationReceived
	});
}

function subscribeAndroid(cb) {
	CloudPush.retrieveDeviceToken({
		success: function(e) {
			if (!e.deviceToken) {
				Ti.App.fireEvent('notifications.subscription.error', e);
				return;
			}

			CloudPush.enabled = true;
			cb(e.deviceToken);
		},
		error: function(e) {
			Ti.App.fireEvent('notifications.subscription.error', e);
		}
	});
}

exports.subscribe = function(channel) {
	if (OS_IOS) return subscribeIOS(function(token){ subscribe(channel, token); });
	if (OS_ANDROID) return subscribeAndroid(function(token){ subscribe(channel, token); });
};

function unsubscribeIOS() {
	Ti.Network.unregisterForPushNotifications();
}

function unsubscribeAndroid() {
	CloudPush.enabled = false;
}

function unsubscribe(channel) {
	var token = Ti.App.Properties.getString('notifications.token');
	if (!token) {
		return;
	}

	Ti.App.Properties.removeProperty('notifications.token');
	Cloud.PushNotifications.unsubscribeToken({
		device_token: token,
		channel: channel || null
	}, function(){
	});
}

exports.unsubscribe = function(channel) {
	if (OS_IOS) unsubscribeIOS();
	if (OS_ANDROID) unsubscribeAndroid();
	unsubscribe(channel);
};

exports.init = function(c, channel){
	config = _.extend(config, c);
};
