# Map

Useful functions for map views.

We offering our own clustering ;)

## Configuration

```javascript
{
    pixelRadius: 20 /* set the min distance to cluster */
}
```

## Clustering

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
