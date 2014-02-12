# Geo

Provide useful methods for localization and routing.

## Configuration

```javascript
{
    accuracy: "ACCURACY_HIGH",
    checkForGooglePlayServices: true,
    directionUrl: "http://appcaffeina.com/static/maps/directions"
}
```

## Localization

Localize current user and get coordinates.

```javascript
require('geo').localize(function(e, latitude, longitude){
    /* ... */
});
```

This functions fires a `geo.start` and `geo.end` events.

It alert the user if the Location services are disabled or if Google Play services are missing (on Android).

## Other methods

**startNavigator(lat, lng, mode)** 

Start the Apple/Google Maps and route to defined coordinates

**getRoute(networkArgs, routeArgs, callback)**

Create a route using an external web service.

*networkArgs* MUST be in this format: `{ origin: "Rome", destination: "Paris" }`

*routeArgs* are merged with the route object

**getRouteFromUserLocation(destination, networkArgs, routeArgs, callback)**

Create a route without defining origin, must starting from user location.

The arguments are the same of *getRoute*.
