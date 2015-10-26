# Sharer

### Share like a sharer, be social!

This module requires many native modules to work better:

* `dk.napp.social` to share with iOS system dialogs on Facebook/Twitter.
* `bencoding.sms` to share via SMS (on iOS)
* `facebook` to share via Facebook on iOS when system dialogs aren't configured, or on Android

Anyway, all methods provide internal fallbacks to make it work.

To display multiple sharing systems, use `Sharer.activity()` method.

#### Argument

All methods accepts an object with the following properties:

```javascript
{
   text: "Sharing is awesome <3",
   image: "http://lorempixel.com/640/640",
   url: "http://mysite.com/awesome/link",
}
```

#### Sharing systems

* **Facebook**
* **Twitter**
* **Email**
* **Google+**
* **WhatsApp**
* **Message**
