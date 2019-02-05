// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

function setActive(val) {
	val = !!val;

	$.activeLbl.applyProperties({
		color: val ? 'green' : 'red',
		text: val ? 'Active' : 'Inactive',
	});
	$.activateBtn.enabled = !val;
}

function activate() {
	FCM.addDataFields(['test1', 'test2']);
	FCM.removeDataFields('test1');
	FCM.activate()
		.then(function() {
			setActive(true);
			$.tokenLabel.text = "" + FCM.getDeviceToken();
		})
		.catch(Ti.API.error);
}

$.tokenLabel.addEventListener('click', function() {
	Ti.UI.Clipboard.clearText();
	Ti.UI.Clipboard.setText($.tokenLabel.text);
	Ti.UI.createAlertDialog({ message: 'Token copied in the clipboard' }).show();
});

$.subscribeBtn.addEventListener('click', function(e) {
	FCM.subscribe();
});

$.unsubscribeBtn.addEventListener('click', function(e) {
	FCM.unsubscribe();
});

$.activateBtn.addEventListener('click', activate);

FCM.addInteractiveNotificationCategory("test", [
	{
		id: "view",
		title: "View",
		callback: function(e) {
			console.log(e);
			alert("Hello!");
		}
	}
]);

if (FCM.areRemoteNotificationsEnabled() && FCM.getDeviceToken() != null) {
	setActive(true);
	$.tokenLabel.text = "" + FCM.getDeviceToken();
} else {
	setActive(false);
}
