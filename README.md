# Trimethyl

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

In your *app/alloy.js* file, do something like:

```javascript
var App = {
	Framework: require('trimethyl')
};
```


## Useful 3-party widgets

* https://github.com/FokkeZB/nl.fokkezb.loading
