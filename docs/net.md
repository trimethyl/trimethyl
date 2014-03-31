# Net

Make all net request in a very simple way.

All requests are cached reading the `Expires` header, so if you don't specify it in your response, nothing is cached.

If there isn't an active Internet connection, the module read content from its internal cache if exists, otherwise a `net.error` event is fired.

Before and after each request, a `net.start` and `net.end` event is fired.

## Configuration

```javascript
{   
    base: 'http://localhost', /* base url for your api service, you can later refer simply with "/method/foo" */
    cacheDir: Ti.Filesystem.applicationCacheDirectory,
    timeout: 10000,
    useCache: true,
    headers: { /* custom headers to add for each request */
        "X-Caffeina": true
    },
    cacheNamespace: 'netcache'
}
```

## Usage

**Example: simple request**

```javascript
require('net').send({
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
require('net').send({
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
require('net').getJSON('http://graph.facebook.com/4', function(info){
    alert('Hello, '+info.first_name);
});
```

**Example: Abort an active request**

```javascript
var hash = require('net').send({ /* ... */ });
/* ... */
require('net').abortRequest(hash);
```