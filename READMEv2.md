# Trimethyl 2 - Titanium toolchain made in Caffeina

[![Titanium](http://www-static.appcelerator.com/badges/titanium-git-badge-sq.png)](http://www.appcelerator.com/titanium/) [![Alloy](http://www-static.appcelerator.com/badges/alloy-git-badge-sq.png)](http://www.appcelerator.com/alloy/)

### [API Documentation](http://caffeinalab.github.io/Trimethyl/)

Trimethyl is not a framework.

Trimethyl is a collection of very useful modules to work with Appcelerator Titanium: you can't live without it!

Most of these modules are proxies for Titanium API, and some of theese add missing features or expose usefuls functions for cross platform development.

![image](http://f.cl.ly/items/3l1F2O1E0O1s0V38402p/trimelogo.png)


## Installation

Open your Terminal, **cd to your Titanium project**, and simply type:

```
curl -L https://raw.githubusercontent.com/CaffeinaLab/Trimethyl/master/install.sh | sh
```

This installation script download the toolchain, unzip it in `app/lib/T` (this is the directory where all modules lives), and synlinks some directories.

## Configuration

Each module reads from the **config.json** your personal configuration, extending its default.

For example, the module `Auth`, will read the `Alloy.CFG.T.auth` object.

You can customize the options, editing your **config.json** file:

```javascript
{ ...
	"T":{
		"auth": {
			...
		},
		"http": {
			...
		}
		...
	}
... }
```

## Initialization

In your *app/alloy.js* file, on the first line:

```javascript
T = function(name) { return require('T/'+name); }
T('trimethyl');
```

The `T` helper function, it's an easier method to load Trimethyl tools.

Requiring **trimethyl** module on startup will bootstrap some important framework files, set prototypes, TSS vars and `Alloy.Globals` vars.


## Modules

To use a module, just require with `T` helper:

```javascript
var Auth = T('auth');
```

## UIFactory module

This is an Alloy functionality: the ability to create UI objects directly from Alloy Views, using the `module` keyword. For example:

```xml
<Alloy>
	<Window title="Awesome window" module="T/uifactory">
		<TextField module="T/uifactory" />
	</Window>
</Alloy>
```

You can obviously wrap theese elements again with your own modules, creating a further module, for example creating a `ui.js` file in your `app/lib` directory:

```javascript
exports.createWindow = function(args) {
	var $el = T('uifactory').createWindow(args);

	...

	return $el;
}
```

## API Documentation

**Please refer to the [documentation](http://caffeinalab.github.io/Trimethyl/) for full-usage of all APIs**.

## License

```
Copyright 2014 Caffeina

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
