// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

var Notifications = T('notifications');

Notifications.onReceived = function(e) {
	alert(e.data.alert);
};

$.subscribeBtn.addEventListener('click', function(e) {
	Notifications.subscribe();
});

$.unsubscribeBtn.addEventListener('click', function(e) {
	Notifications.unsubscribe();
});

$.activateBtn.addEventListener('click', function(e) {
	Notifications.activate();
});

$.deactivateBtn.addEventListener('click', function(e) {
	Notifications.deactivate();
});

Notifications.addInteractiveNotificationCategory("test", [
	{ 
		id: "view", 
		title: "View", 
		callback: function(e) {
			console.log(e);
			alert("Hello!");
		}
	}
]);

Notifications.activate();