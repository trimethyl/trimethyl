# WebAlloy

### µ-web-framework to write Alloy apps in HTML/CSS/JS.

The unique method `WebAlloy.createView` create a WebView with static html inside.

To work with WebAlloy, you have to replicate the exact structure of an Alloy MVC pattern (*views/controllers/styles*) in the `/app/web` directory.

## Globals files

##### `/app/web/app.css`
Global CSS included in each view.

##### `/app/web/app.jslocal`
Global JS included in each view.

##### `/app/web/lib/**.jslocal`
Put your jslocal files here, they are automatically appended at the end of the HTML.

## MVC specific files

##### `/app/web/views/foo.tpl`
HTML/TPL (underscore templating system) file that is parsed and written in the static HTML.

##### `/app/web/controllers/foo.jslocal` (opt.)
Javascript file included in the specific controller.

##### `/app/web/styles/foo.css` (opt.)
CSS file included in the specific controller.

When you have replicated this structure, you can just call:

```javascript
WebAlloy.createView({
	name: 'foo', // necessary
	webdata: { ... }, // optional
	webapi: { ... } // optional
	...
});
```

`name`, `webdata` and `webapi` are WebAlloy properties, all the other arguments are Ti-UI specific for the classic WebView.

#### `name`

**Required** option is to specificy the files to load.

#### `webdata`

Object passed to the TPL file and rendered with the Underscore template system; for example:

```javascript
WebAlloy.createView({
   name: 'foo',
   webdata: {
      girls: [ 'Julie', 'Sarah', 'Valentine' ],
      team: 'Caffeina'
   }
});
```

```html
<h1><%= team %> girls</h1>
<ul>
<% _.each(girls, function(name) { %>
   <li><%= name %></li>
<% }); %>
</ul>
```

#### `webapi`

Is an object containing a series of API that are automatically exposed in the WebView.

You can easily interface from the WebView to Titanium with the `webapi` object passed to the constructor.

In the WebView, you've got an helper `WebAlloy` to run the API exposed.

For example:

```javascript
WebAlloy.createView({
   name: 'foo',
   webapi: {
      close: function() { this.close(); }
   }
});
```

In the controller `/app/web/controllers/foo.js` file, you have the `WebAlloy` object with the `run` method:

```javascript
WebAlloy.run('close');
```

**If you use WebAPI, remember to call `.webapiUnbind()` to remove the listeners!!!**

## HTML output

So, the final result is an HTML string passed to the WebView, like this:

```html
<!DOCTYPE html>
<html>
	<head>
		... metas ...
		<style>{{ app.css }}</style>
		<style>{{ foo.css }}</style>
	</head>
	<body>
		<div id="main">
			{{ foo.tpl (rendered in undescore with webdata argument) }}
		</div>
		<script>{{ lib/**.jslocal }}</script>
		<script>{{ app.jslocal }}</script>
		<script>{{ foo.jslocal }}</script>
	</body>
</html>
```

## WebView additional method

Basically, you can interact with DOM elements with `evalJS`.

There are some proxy methods designed to interact directly:

##### `render({ data })`

Re-render the template with new data passed.

##### `call(...)`

Call a function in the WebView.

For example, `$.wv.call('foo', 1, 2, {x:1})` will be converted to js in `foo(1, 2, {x:1})`.

##### `$(selector).call(...)`

Call a function in a DOM-RAW object.

##### `$(selector).get(...)`

Get a property of a DOM-RAW object.

##### `$(selector).set(...)`

Set a property of a DOM-RAW object.
