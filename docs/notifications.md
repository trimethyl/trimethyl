# Notifications

Cross-platform module for notifications.

We use ACS (Appcelerator Cloud Service) via APN/GCM to send notifications.

Keep in mind that you have to generate .p12 certificates for iOS and api-key for Android in order to use notifications, please first follow this guide http://docs.appcelerator.com/titanium/3.0/#!/guide/Push_Notifications.

## Requirements

**ti.cloud** and **ti.cloudpush**, but yet integrated in Titanium SDK.

Just add this to your *tiapp.xml*:

```xml
<module>ti.cloud</module>
<module platform="android">ti.cloudpush</module>
```

## Configuration

```javascript
{
    inAppNotification: true, /* provide in app-notification handled automatically */
    inAppNotificationMethod: 'toast', /* choose between alert, toast */
    autoReset: true /* autoreset the badge on upcoming notification */
}
```

## Usage

First of all, you have to subscribe to APN/GCM channels

```javascript
require('notifications').subscribe('channel');
```

And simply listen for notification for custom actions (optional).

```javascript
Ti.App.addEventListener('notifications.received', function(e){
    console.log(e);
});
```