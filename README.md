# Archived - This repo has been archived and is not being maintained.

![image](logo.jpg)

Trimethyl is a framework we built for our purposes. We built it on top of **Appcelerator Titanium**.

Most of these modules are proxies for Titanium API, and some of these add missing features or expose useful functions for cross platform development.

Check the [API Documentation](http://trimethyl.github.io/trimethyl) to see all modules and all methods you can use. If you like Dash Kapeli, [download the Dash Kapeli Docset](https://github.com/trimethyl/trimethyl/blob/master/docset/Trimethyl.tgz?raw=1).

For a more descriptive usage, with examples and common use cases, [check the wiki](https://github.com/trimethyl/trimethyl/wiki).

![NPM version](https://img.shields.io/npm/dm/trimethyl.svg)
![NPM downloads](https://img.shields.io/npm/dt/trimethyl.svg)

## Installation via NPM

[![NPM](https://nodei.co/npm/trimethyl.png)](https://npmjs.org/package/trimethyl)

Trimethyl comes with its own package manager for the internal libraries, because we don't want that the final user installs all libraries, but only the one which he uses. For this reason, you have to install it as a global helpers and install all libraries via CLI.

```
[sudo] npm install -g trimethyl
```

## Installation of libraries

Now you have the CLI command `trimethyl`. To install your libraries, cd to your Alloy project, and just type:

```
trimethyl install
```

If is the first installation, the command will prompt to add the libraries you want to use. 

Otherwise, it will perform a re-installation of all libraries configured in the `trimethyl.json` file.

You can pass these parameters to the install method:

#### `--no-check-downgrade`

Do not perform a check if current installation is a downgrade.

#### `--no-check-majorupgrade`

Do not perform a check if current installation is a major upgrade.

#### `--native-module-skip`

If a library depends on a native module, just skip the installation *of the module*.

#### `--native-module-add`

If a library depends on a native module, just add the native module to the *tiapp.xml*

#### `--native-module-skip`

If a library depends on a native module, try to install the native module via package manager (*GITTIO*).

## Configure libraries

You can specify later (after installation) which libraries you want to add, just type:

```
trimethyl add {module}
```

It will add the library to your `trimethyl.json` file.

Now just type `trimethyl install` to perform the installation again.

## Configuration

Each library reads from the **config.json** your personal configuration, extending its default.

For example, the module named `{Module}`, will read the `Alloy.CFG.T.{module}` object; the submodule `{Sub}` of `{Module}`, will read `Alloy.CFG.T.{module}.{submodule}`.

You can customize the options, editing your **config.json** file:

```json
{
   "T":{
      "module": {
         "sub": {}
      },
   }
}
```

For example to set the base URL for the HTTP library, configure the *T* section just like this:

```json
{
   "T":{
      "http":{
         "base": "http://yourserver.com/api/v1"
       }
    }
}
```

## Initialization of the libraries

The first thing you have to do is, in your *app/alloy.js* file, to require the framework bootstrap and define a global helper `T`:

```javascript
// Global T helper to load internal Trimethyl libraries
var T = function (name) { return require('T/' + name); }

// Bootstrap Trimethyl
T('trimethyl');
```

Requiring **trimethyl** using the code `T('trimethyl')` on startup will bootstrap some important framework files, set prototypes, TSS vars and `Alloy.Globals` variables.

You have to do that, otherwise some libraries will break up.

## Libraries

To use a library, just require with `T` helper.

```javascript
var Util = T('util');
```

It's useful to declare global modules that you'll use in the entire app in the `alloy.js` file to make them available through the variable name.

Otherwise, just like all CommonJS modules, you can require them later in your controllers.

## UIFactory library

The UIFactory library is special library that handle all UI proxies. Thanks to an Alloy feature, you have the ability to create UI objects directly from Alloy Views, using the `module` keyword. For example:

```xml
<Alloy>
	<Window title="Awesome window" module="T/uifactory">
		<TextField module="T/uifactory" />
	</Window>
</Alloy>
```

## Example app

You can check an example app here: [https://github.com/caffeinalab/magneto](https://github.com/caffeinalab/magneto)

## API Documentation

**Please refer to the [documentation](http://trimethyl.github.io/trimethyl) for full-usage of all APIs**.

#### Dash Kapeli URL

```
dash-feed://https%3A%2F%2Fraw.githubusercontent.com%2Fcaffeinalab%2Ftrimethyl%2Fmaster%2Fdocset%2FTrimethyl.xml
```

## Copyright and license

Copyright 2014 [Caffeina](http://caffeina.co) srl under the [MIT license](LICENSE).
