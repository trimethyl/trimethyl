# Trimethyl 2

### [API Documentation](http://caffeinalab.github.io/Trimethyl/)  --  [Wiki](https://github.com/CaffeinaLab/Trimethyl/wiki)

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/CaffeinaLab/Trimethyl?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Titanium](http://www-static.appcelerator.com/badges/titanium-git-badge-sq.png)](http://www.appcelerator.com/titanium/) [![Alloy](http://www-static.appcelerator.com/badges/alloy-git-badge-sq.png)](http://www.appcelerator.com/alloy/)

Trimethyl is a collection of very useful modules to work with **Titanium**.

Most of these modules are proxies for Titanium API, and some of these add missing features or expose useful functions for cross platform development.

![image](http://f.cl.ly/items/3l1F2O1E0O1s0V38402p/trimelogo.png)


## Installation via NPM

In your Titanium project, run:

```
npm install trimethyl
```

## Update via NPM

```
npm update trimethyl
```

## Installation via GitHub

If you want to install via GitHub, just clone/download this repository and extract it in `app/lib/T`.

```
git clone git@github.com:CaffeinaLab/Trimethyl.git app/lib/T
```

## Configuration

Each module reads from the **config.json** your personal configuration, extending its default.

For example, the module named `{Module}`, will read the `Alloy.CFG.T.{module}` object; the submodule `{Sub}` of `{Module}`, will read `Alloy.CFG.T.{module}.{submodule}`; etc..

You can customize the options, editing your **config.json** file:

```javascript
{ 
	"T":{
		"module": {
			...
			"sub": {
				...
			}
		},
	}
}
```

## Initialization

In your *app/alloy.js* file:

```javascript
T = function (name) { return require('T/'+name); }
T('trimethyl');
```

`T` it's an easier method to load Trimethyl modules.

Requiring **trimethyl** by `T('trimethyl')` module on startup will bootstrap some important framework files, set prototypes, TSS vars and `Alloy.Globals` variables.

## Modules

To use a module, just require with `T` helper:

```javascript
var Util = T('util'); /* same of require('T/util') */
```

It's useful to declare global modules that you'll use in the entire app in the `alloy.js` file to make them available through the variable name.

## UIFactory module

This is an Alloy feature: the ability to create UI objects directly from Alloy Views, using the `module` keyword. For example:

```xml
<Alloy>
	<Window title="Awesome window" module="T/uifactory">
		<TextField module="T/uifactory" />
	</Window>
</Alloy>
```

You can obviously wrap these elements again with your own modules, creating a further module, for example creating a `ui.js` file in your `app/lib` directory:

```js
exports.createWindow = function(args) {
	var $el = T('uifactory').createWindow(args);

	// ...

	return $el;
}
```

## API Documentation

**Please refer to the [documentation](http://caffeinalab.github.io/Trimethyl/) for full-usage of all APIs**.

## Contributing

How to get involved:

1. [Star](https://github.com/CaffeinaLab/Trimethyl/stargazers) the project!
2. Answer questions that come through [GitHub issues](https://github.com/CaffeinaLab/Trimethyl/issues?state=open)
3. [Report a bug](https://github.com/CaffeinaLab/Trimethyl/issues/new) that you find

Pull requests are **highly appreciated**.

Solve a problem. Features are great, but even better is cleaning-up and fixing issues in the code that you discover.

## Copyright and license

Copyright 2014 [Caffeina](http://caffeina.co) srl under the [MIT license](LICENSE.md).

<p align="center"><a href="http://caffeina.co" target="_blank" title="Caffeina - Ideas Never Sleep"><img src="https://github.com/CaffeinaLab/BrandResources/blob/master/caffeina-handmade.png?raw=true" align="center" height="65"></a></p>
