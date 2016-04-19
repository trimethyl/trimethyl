# Router

With the Router object you can emulate the **routing concept** adopted in many web framework, like *Laravel* or *Symphony*.

Basically, with this paradigma you associate a string (*route name*) with a callback function that (most of the time) open a Window in your app. 

Which are the pro? 

* A well known structure of your app tree defined *a priori*.
* Automatic Google Analitycs report of each view / window / feature (if used in the combination with the **Flow** module)
* A way to handle *deep links* and *universal links** in a bit

A common implementation is the following:

```javascript
var Router = T('router');

Router.on('/home', function() {
	Flow.open('home', {}, null, this.source); 
});

Router.on(new RegExp('/users/(\d+)'), function(id) {
	Flow.open('user', {
		id: id,
		query: this.queryKey
	}, null, this.source);
});
```

In the first case, a simple controller called `home` is opened.

In the second example, a more complex regex is used to match the `user ID` and make the route dynamic.

You can (obviously) fetch the model a priori, handle eventual errors or open the controller.

```javascript
Router.on(/\/users\/(\d+)/, function(id) {
	var route = self;
	var model = Alloy.createModel('user', { id: id });
	model.fetch({
		success: function() {
			Flow.open('user', {
				model: model,
				id: id,
				query: route.queryKey
			}, null, route.source);
		},
		error: function(err) {
			alert(err);
		}
	});
});
```

The `queryKey` property has the optional URL parameters. For example, in the string `/users/55?picture=yes&test=caffeina` it will be:

```javascript
{
	picture: "yes",
	test: "caffeina"
}
```

### Open a route

To open a route, just call:

```javascript
Router.dispatch('/users/4');
```

### Queue

Sometimes, is necessary to enqueue the route and open after that UI is fully loaded; to do that, just call:

```javascript
Router.enqueue('/home');
```

And, when your UI is loaded:

```javascript
$.myMainWindow.addEventListener('open', function() {
	Router.dispatchQueue(true);
});
```