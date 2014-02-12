# Installation and configuration

## Installation

Open terminal, move to your Titanium project, and type

```
git clone https://bitbucket.org/caffeina/trimethyl app/lib
```

All your custom code out of the framework can be placed in `app/lib/app/*` 

## Configuration

In your *app/config.json* file, add a key `autoConfModules` and specify the modules you want to load as array.

```javascript
{
	"global": {
		"autoConfModules": [ "MODULE1", "MODULE2", "MODULE3" ],
		"MODULE1": {
			...
		},
		"MODULE2": {
			...
		}
	}
}
```

For each module, add a key with the exact name of the module and put its configuration: it will be loaded and configured automatically on startup.

## Initialization

In your *app/alloy.js* file, do:

```javascript
var App = {
	Framework: require('trimethyl')
};
```

# Available modules

## Auth

Manage authentication in a simple way. Require a *model/user.js* to store current user.

All authentication methods require a driver that handle request. Available drivers are:

* Standard
* Facebook

#### Configuration

```javascript
{
	"drivers": {
		"facebook": {
			"appId": "[YOURAPPID]",
			"permissions": "[PERMISSIONS_COMMA_SEPARATED]"
		},
		"std": {}
	}
}
```

##### User model example (models/user.js)

```javascript
exports.definition = {

	config : {
		adapter: {
			type: 'api',
			name: 'users'
		}
	},

	extendModel: function(Model) {
		_.extend(Model.prototype, {

			getPicture: function(){
				return require('util').getFacebookAvatar(this.get('facebook_id'));
			},

			isFacebook: function(){
				return !!this.get('facebook_id');
			}

		});
		return Model;
	}

};
```

##### Login for the first time

To use, you **have to*** load the driver you'll use.

```javascript
var Auth = require('auth');
var FacebookAuth = Auth.loadDriver('facebook');
var StdAuth = Auth.loadDriver('std');
```

To login with Facebook, simply call:

```javascript
FacebookAuth.login();
```

Otherwise, if you login in a standard way:

```javascript
var data = {
	email: $.email.value.toString(),
	password: $.password.value.toString()
};
/* Validate data */
StdAuth.login(data);
```

The module will fire *auth.success* or *auth.fail*, so you'll just handle it and redirect your flow; for example:

```javascript
Ti.App.addEventListener('auth.success', function(e){
	/* Open your logged view */
});

Ti.App.addEventListener('auth.logout', function(e){
	/* Close your logged view */
});

Ti.App.addEventListener('auth.fail', function(e){
	/* warns the user and other stuffs */*
	require('util').alertError(e.message);
});
```

##### Automatic login

If you logged in a previous session, you'll have to login automatically without user prompt.

Do it like this:

```javascript
Auth.handleLogin();
```

The module has stored previously if the user is logged (driver-indipendent), so just call `handleLogin`.

If no user is stored on the device, the module fire a `app.login` event.

##### Logout

Simply call `Auth.logout()` and a `auth.logout` event is fired.

##### Get current user

Calling `Auth.user()` or `Auth.me()` expose current user model, for example:

```javascript
Ti.App.addEventListener('auth.success', function(){
	var me = require('auth').user();
	alert("Hello "+me.get('first_name'));
});
```

## Events

Is a proxy module for Titanium App-Event.

#### Usage

```javascript
var E = require('events');

E.add('hello', function hello(e){ alert('Hello '+e.name); });
E.add('test', function(e){ alert('Test 1'); });
E.add('test', function(e){ alert('Test 2'); });

E.fire('hello', { name:'Fefifo' });
E.remove('test'); // remove every event with 'test' key
E.remove('hello', hello); // remove only 'hello' event with that closure (Classic Titanium style)
```

Every event fired is fully compatible with `Ti.App`, so:

```javascript
E.add('hello', function(){ /* ... */ });
Ti.App.addEventListener('hello', function(){ /*...*/ });
```

these two are the same, like thoose:

```javascript
E.fire('hello');
Ti.App.fireEvent('hello');
```


## GA

Proxy object for ** Google Analitycs module **.

#### Requirements

https://github.com/MattTuttle/titanium-google-analytics

`gittio install -g analytics.google`

#### Configuration

```javascript
{
	"ua": "UA-00112233444"
}
```

#### Usage

See https://github.com/MattTuttle/titanium-google-analytics for full methods.

```javascript
require('ga').trackEvent({
	label: 'Fefifo Event',
	value: 3
});
```



## Geo

Provide useful methods for localization and routing.

#### Configuration

```javascript
{
	accuracy: "ACCURACY_HIGH",
	checkForGooglePlayServices: true,
	directionUrl: "http://appcaffeina.com/static/maps/directions"
}
```

#### Usage

##### Localization

Localize current user and get coordinates.

```javascript
require('geo').localize(function(e, latitude, longitude){
	/* ... */
});
```

This functions fires a `geo.start` and `geo.end` events.

It alert the user if the Location services are disabled or if Google Play services are missing (on Android).

##### Other methods

**startNavigator(lat, lng, mode)** 

Start the Apple/Google Maps and route to defined coordinates

**getRoute(networkArgs, routeArgs, callback)**

Create a route using an external web service.

*networkArgs* MUST be in this format: `{ origin: "Rome", destination: "Paris" }`
*routeArgs* are merged with the route object

**getRouteFromUserLocation(destination, networkArgs, routeArgs, callback)**

Create a route without defining origin, must starting from user location.

The arguments are the same of *getRoute*.


## Map

Useful functions for map views.

We offering our own clustering ;)

#### Configuration

```javascript
{
	pixelRadius: 20
}
```

#### Usage

##### Clustering

You MUST use a Backbone Collection for your places.

```javascript
$.mapView.addEventListener('regionchanged', function(e){
	var MC = require('map').cluster(e, Places);
	var Markers = [];
	
	/* Processing clusters, objects */
	_.each(MC.clusters, function(c){
		Markers.push(require('ti.map').createAnnotation({
			latitude: c.latitude,
			longitude: c.longitude,
			image: '/images/cluster.png'
		}));
	});
	
	/* Processing single markers, list of IDs */
	_.each(MC.markers, function(id){
		var marker = Places.get(id);
		Markers.push(require('ti.map').createAnnotation({
			latitude: marker.get('lat'),
			longitude: marker.get('lng'),
			title: marker.get('title'),
			id: id
		}));
	});
	
	/* Set finally the annotations */
	$.mapView.setAnnotations(Markers);
});
```


## Network

Make all network request in a very simple way.

All requests are cached reading the `Expires` header.

If there isn't an active Internet connection, the module read content from its internal cache if exists, otherwise a `network.error` event is fired.

Before and after each request, a `network.start` and `network.end` event is fired.

#### Configuration

```javascript
{	
	base: 'http://localhost', /* base url for your api service */
	cacheDir: Ti.Filesystem.applicationCacheDirectory,
	timeout: 10000,
	useCache: true,
	headers: { /* custom headers to add for each request */
		"X-Caffeina": true
	},
	cacheNamespace: 'netcache'
}
```

#### Usage

**Example: simple request**

```javascript
require('network').send({
	url: 'http://your-api-server.com/json_response',
	method: 'POST',
	info: {
		mime: 'json' /* force to parse as json */
	},
	success: function(info) {
		console.log(info);
	},
	error: function(err) {
		alert(err);
	}
});
```

**Example: download an image and cache for a specific TTL**

```javascript
require('network').send({
	url: 'http://graph.facebook.com/4/picture',
	info: {
		expire: (+new Date()+60*60*24) /* optional, force TTL */
	},
	success: function(blob) {
		$.imageView.image = blob;
	},
	complete: function() {
		alert("Image downlaoded!");
	}
});
```

**Example: retrieve Facebook info**

```javascript
require('network').getJSON('http://graph.facebook.com/4', function(info){
	alert('Hello, '+info.first_name);
});
```

**Example: Abort an active request**

```javascript
var hash = require('network').send({ /* ... */ });
/* ... */
require('network').abortRequest(hash);
```

# Useful 3-party widgets

* https://github.com/FokkeZB/nl.fokkezb.loading
