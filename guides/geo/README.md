# Geo

### Geographic API proxy and Map additional features like clustering.

## Get current position

To retrieve current user position, use `getCurrentPosition()`.

The method automatically raise `geo.start` and `geo.end` events, unless you pass `silent: true`

```js
Geo.getCurrentPosition({
   silent: true,
   success: function(coords) {
      Ti.API.debug("You are at " + coords.latitude + ", " + coords.longitude);
   },
   error: function(err) {
      if (err.servicesDisabled === true) {
         Ti.API.error('Please activate the location services');
      } else {
         Ti.API.error("I can't localize you man: " + err);
      }
   }
});
```

The Object returned from the **success** callback is a [LocationCoordinates type](http://docs.appcelerator.com/titanium/3.0/#!/api/LocationCoordinates).

## Clustering

When there are so many markers, you must cluster them.

The method is `markerCluster(markers, event)`.

The `event` is retrieved from `TiMap.regionchanged` event, the markers could an instance of `Backbone.Collection` or an Object id-indexed.

Each single marker of the collection must be in this format:

```js
{ lat: {Number}, lng: {Number}, id: {Number, Unique} }
```

The returned value is an Array: if the marker is a cluster, an object like is passed:

```js
{ 
   latitude: {Number}, // latitude of the marker
   longitude: {Number}, // longitude of the markers
   count: {Number}  // the number of markers clustered
}
```

Otherwise, the ID of the marker in your marker collections is returned.

This is a sample code to clarify:

```js
var TiMap = require('ti.map');
var WhateverCollection = Alloy.createCollection('whatever');

// the handler
function updateMap(event) {
   var data = Geo.markerCluster(event, WhateverCollection);
   var annotations = [];
   _.each(data, function(c){
      if (_.isNumber(c)) {
         // if the marker is a Number, we have a reference in our AlloyCollection or HashMap
         var marker = Me.get(c); 
         annotations.push(TiMap.createAnnotation({
         	id: c,
         	latitude: marker.get('lat'), longitude: marker.get('lng'),
         	title: marker.get('title'),
         }));
      } else {
         // otherwise, just create an annotation!
         annotations.push(TiMap.createAnnotation({
            latitude: c.latitude, longitude: c.longitude
         }));
      }
   });

   // finally, set the annotations
   $.mapView.setAnnotations(annotations);
}

// Fetch the collection
WhateverCollection.fetch({
   success: function() {
      updateMap(_.extend($.mapView.region, { source: $.mapView })); // Render the clusters first-time
      $.mapView.addEventListener('regionchanged', updateMap); // add the handler to update the map every time that a regionbound is changed
   }
});
```

You can configure the clustering with **config.json** configuration, with these properties:

* `clusterPixelRadius`: The clustering radius expressed in *px*
* `clusterRemoveOutofBB`: Remove markers that are out of the bounding box to optimize memory
* `clusterMaxDelta`: The value before the clustering is off.
