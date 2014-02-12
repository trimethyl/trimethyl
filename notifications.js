var Cloud = require("ti.cloud");
Cloud.debug = Alloy.CFG.debug;

if (OS_ANDROID) {
	var CloudPush = require('ti.cloudpush');
	CloudPush.debug = Alloy.CFG.debug;
	CloudPush.enabled = true;
	CloudPush.showTrayNotificationsWhenFocused = true;
	CloudPush.focusAppOnPush = false;
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
			if (config.inAppNotificationMethod=='toast') showToast(e.data.alert);
			else if (config.inAppNotificationMethod=='alert') alert(e.data.alert);
		}
	}
}

exports.setBadge = setBadge = function(x) {
	if (OS_IOS) Ti.UI.iPhone.setAppBadge(Math.max(x,0));
};

exports.getBadge = getBadge = function() {
	if (OS_IOS) return Ti.UI.iPhone.getAppBadge();
};

exports.incBadge = function(i) {
	setBadge(getBadge()+i);
};

exports.showToast = showToast = function(msg, image, timeout) {
	var INAPP_VIEW_HEIGHT = 65;
	var inAppNotifView = Ti.UI.createWindow({
		top: -INAPP_VIEW_HEIGHT,
		height: INAPP_VIEW_HEIGHT,
		backgroundColor: '#B000',
		fullscreen: true
	});
	inAppNotifView.addEventListener('touchstart', function(e){
		clearTimeout(inAppTimeout);
		inAppNotifView.animate({ top: -INAPP_VIEW_HEIGHT }, function(){ inAppNotifView.close(); });
	});
	inAppNotifView.add(Ti.UI.createImageView({
		left: 10,
		image: image || '/appicon.png',
		height: INAPP_VIEW_HEIGHT-20,
		width: INAPP_VIEW_HEIGHT-20,
		borderRadius: (INAPP_VIEW_HEIGHT-20)/2,
		touchEnabled: false
	}));
	inAppNotifView.add(Ti.UI.createLabel({
		color: '#fff',
		text: msg,
		touchEnabled: false,
		left: 10+(INAPP_VIEW_HEIGHT-20)+15,
		top: 10,
		bottom: 10,
		right: 10,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		font: { fontSize: 14 }
	}));
	inAppNotifView.add(Ti.UI.createView({
		height: 0.5,
		bottom: 0,
		backgroundColor: '#D000',

	}));
	inAppNotifView.open();
	inAppNotifView.animate({ top: 0 });
	var inAppTimeout = setTimeout(function(){
		inAppNotifView.animate({ top: -INAPP_VIEW_HEIGHT }, function(){ inAppNotifView.close(); });
	}, timeout || 4000);
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
			return Ti.App.fireEvent('notifications.subscription.error',
				e.message || L('notification.subscription.error.acs', 'Error while subscribing for notifications on ACS.'));
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
				Ti.App.fireEvent('notifications.subscription.error',
					e.message || L('notification.subscription.error', 'Error while subscribing for notifications.'));
				return;
			}
			cb(e.deviceToken);
		},
		error: function(e){
			Ti.App.fireEvent('notifications.subscription.error',
				e.message || L('notification.subscription.error', 'Error while subscribing for notifications.'));
		},
		callback: notificationReceived
	});
}

function subscribeAndroid(cb) {
	CloudPush.retrieveDeviceToken({
		success: function(e) {
			if (!e.deviceToken) {
				Ti.App.fireEvent('notifications.subscription.error',
					e.message || L('notification.subscription.error', 'Error while subscribing for notifications.'));
				return;
			}
			CloudPush.addEventListener('callback', notificationReceived);
			cb(e.deviceToken);
		},
		error: function(e) {
			Ti.App.fireEvent('notifications.subscription.error',
				e.message || L('notification.subscription.error', 'Error while subscribing for notifications.'));
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
	CloudPush.removeEventListener('callback', notificationReceived);
}

function unsubscribe(channel) {
	var token = Ti.App.Properties.getString('notifications.token');
	if (!token) return;
	Ti.App.Properties.removeProperty('notifications.token');
	Cloud.PushNotifications.unsubscribeToken({
		device_token: token,
		channel: channel || null
	}, function(){});
}

exports.unsubscribe = function(channel) {
	if (OS_IOS) unsubscribeIOS();
	if (OS_ANDROID) unsubscribeAndroid();
	unsubscribe(channel);
};

exports.init = function(c, channel){
	config = _.extend(config, c);
};
