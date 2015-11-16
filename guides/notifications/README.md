# Notifications

## Notifications manager

With this module you can handle the notifications system both on iOS and Android.

The Android module (written by us) is [Caffeina GCM](https://github.com/CaffeinaLab/GCM), and handles all `Ti.Network` features with the same syntax.

### Subscription and receiving notifications

First of all, you have to set a driver in your `config.json` under `T`.

In `alloy.js` file just write:

```
var Notifications = require('T/notifications');
Notifications.onReceived = function() {

};
```

When you are ready to subscribe the user (this method will prompt an alert), call:

```
Notifications.subscribe();
```

This will register the device to the APN/GCM servers, will cache the token for future activations in the same session and will send that token (plus other informations about the app/platform) to the specified driver.

#### Interactive notifications

Starting on iOS 8, you can define interactive notifications.

The original Titanium/iOS syntax is horrible, so we have redefined that:

```
Notifications.addInteractiveNotification("ARTICLE", [
	{
		id: "ARTICLE_READ",
		title: "Read",
		openApplication: true
	},
	{
		id: "ARTICLE_OFFLINE",
		title: "Mark to read offline"
	}
], function(e) {
	switch (e.identifier) {
		
		case "ARTICLE_READ":
		Alloy.createController("article", { id: e.data.id_article })
		break;
		
		case "ARTICLE_OFFLINE":
		Alloy.createModel("article", { id: e.data.id_article }).download();
		break;
		
	}
});
```

Now, from your server, just send a payload containing almost:

```
{
	"category": "ARTICLE",
	"id_article": 2
	// ...

}
```