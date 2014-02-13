# Api Sync

This is an Alloy Backbone sync for REST API.

To let a model use this sync, just set

```javascript
exports.definition = {
	config : {
		adapter: {
			type: 'api',
			name: 'your_model_name_as_plural' /* Example: users */
		}
	}
};
```

in your model file (*app/models/yourmodel.js*)

## Usage

You can pass arguments to *Network.js* just setting the key `networkArgs` in the `fetch` function... similarly you can pass additionals arguments to your server via GET/POST just settings the key `args` when fetching.

### Get a collection

```javascript
/* HTTP/1.1 GET /users?all=true */
var C = Alloy.createCollection('user');
C.fetch({
    args: { all: true },
    ready: function(){ /* ... */ }
});
```

### Get a model

```javascript
 /* HTTP/1.1 GET /user/4 */
var User = Alloy.createModel('user', { id: 4 });
User.fetch({
    networkArgs: { refresh: true }, /* (optional) networkArgs are arguments passed to Network.send() */
    ready: function(){
        console.log("Hi, "+User.get('name'));
    }
});
```

### Get a collection with options

```javascript
/* HTTP/1.1 GET /users?personal=true&foo=bar */
var C = Alloy.createCollection('user');
C.fetch({
    args: {
        personal: true,
        foo: 'bar'
    }
    ready: function(){ /* ... */ }
});
```


### Save a model

```javascript
/* HTTP/1.1 PUT /user/4 */
User.save();
```

For all methods, just go here: http://backbonejs.org/#Model-sync