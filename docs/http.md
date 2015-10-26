## HTTP

### Make HTTP requests is a simple way.

HTTP is a proxy for `Ti.Network.HTTPClient`, with automatic encoding, response caching, queue.

#### Automatic encoding

When performing a request, if the response header contain a `Content-Type: application/json`, the output will be decoded automatically to a Javascript Object.

#### Events

All requests (unless specifying manually the flag `silent: true`) raise two events:

* `http.start`: raised when the request starts
* `http.end`: raised then the request end

With these events, you can manage (for example) a global Loader for all network requests.

For example, using the ours awesome loader widget **Ti.Loader**, just put in the `alloy.js` file:

```javascript
var HTTP = T('http');
var LoadWidg = Alloy.createWidget('com.caffeinalab.titanium.loader');

Event.on('http.start', function(){
	LoadWidg.show(L('app_pleasewait'));
});

Event.on('http.end', function(){
	if (HTTP.isQueueEmpty()) {
		LoadWidg.hide();
	}
});
```

*The method `HTTP.isQueueEmpty()` return a boolean that indicates if the network queue of requests is empty.*

#### Cache

If not explicited declared, all requests are cached in the SQLite database *app*, in the `http` table.

You can not cache a request by passing the `cache: false` option, if you want to refresh a request, pass the `refresh: true` option.

The expiration time of cache depends from (in order of override):

* The global HTTP config parameter `defaultCacheTTL`, expressed in seconds.
* The HTTP response header `Expires: X`, with `X` as a valid Javascript date.
* The HTTP response header `X-Cache-Ttl: X`, with `X` as number of seconds
 

## Examples

#### Make a simple GET Request

Say hello to Mark!

```javascript
HTTP.send({
	url: 'http://graph.facebook.com/4'
}).error(function() {
	console.error("Uhm... Facebook is down?");
}).success(function(jsonInfo) {	
	console.log("Hello, " + jsonInfo.name + "!");
	// print "Hello, Mark Zuckerberg!"	
});
```

or, shortly:

```javascript
HTTP.get('http://graph.facebook.com/4').success(function(j) {
	console.log("Hello, "+j.name+"!");
});
```

#### Go POST (with callbacks instead of promises)

```javascript
HTTP.send({
	method: 'POST',
	url: 'http://...',
	data: {
		foo: 'bar',
		fef: [1,2,3]
	},
	error: function(){ 
		console.error("What is wrong with you?");
	},
	success: function(resp) {
		// ...
	}
});
```

#### Generic requests with custom headers

You can obviously pass custom headers for each request.

```javascript
HTTP.send({
	url: 'http://...',
	method: 'PUT',
	headers: {
		'Content-Type': 'application/json',
		'X-Custom-Header': 42
	},
	success: function(resp) {
		// ...
	}
});
```

Alternatively, if a custom header must be globally for each request, use the `addHeader` method:

```javascript
HTTP.addHeader('X-Auth-Token', 'f3f1f0');
```

#### Download a file

Use the `HTTP.download` method to download a file instead processing response.

```javascript
HTTP.download('http://site.com/file.sqlite', 'database.sqlite', 
function(file) { console.log("Database is stored in " + file.nativePath); },
function(err) { Ti.API.error(err); },
function(e) { console.log("Download state: " + e.progress); });
```

#### Aliases

There are some aliases to get your life easier.

* `get(url, success, error)`: Perform a simple GET request
* `post(url, data, success, error)`: Perform a simple POST request
* `(get|post)JSON(url, data, success, error)`: Perform a GET/POST request and indicates that the response **must** be parsed as JSON, even if there's no `Content-Type: application/json` header in the response.