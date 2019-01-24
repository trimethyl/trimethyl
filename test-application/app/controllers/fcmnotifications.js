// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

var FCMNotifications = require('T/firebase/cloudmessaging');

FCMNotifications.onReceived = function(e) {
	alert(e.data.alert);
};

$.subscribeBtn.addEventListener('click', function(e) {
	FCMNotifications.subscribe();
});

$.unsubscribeBtn.addEventListener('click', function(e) {
	FCMNotifications.unsubscribe();
});

$.activateBtn.addEventListener('click', function(e) {
	FCMNotifications.activate();
});

FCMNotifications.addInteractiveNotificationCategory("test", [
	{
		id: "view",
		title: "View",
		callback: function(e) {
			console.log(e);
			alert("Hello!");
		}
	}
]);

FCMNotifications.activate();