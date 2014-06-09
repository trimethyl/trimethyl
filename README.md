# Trimethyl

### [API Documentation](http://caffeinalab.github.io/Trimethyl/)


### Alloy-Titanium framework made in [Caffeina](http://caffeinalab.com)

A collection of very useful modules to work with Appcelerator Titanium and Alloy.

Most of these modules are proxy object for Titanium API and some of these add features missing or expose functions usefuls for UI normalization.

![image](http://f.cl.ly/items/3l1F2O1E0O1s0V38402p/trimelogo.png)


## Installation

To install this framework, you have to **replace** your lib directory.

So, open terminal, move to your Titanium project, and type

```
git clone git@github.com:CaffeinaLab/Trimethyl.git app/lib
```

All your custom code out of the framework can be placed in `app/lib/app/*`, that is in .gitignore.

## Initialization

In your *app/alloy.js* file, on the first line:

```javascript
require('trimethyl');
```

This will bootstrap some important framework files, set prototypes, TSS and Alloy.Globals vars.

## CommonJS Modules

To require a module, just call

```javascript
var X = require('X');
```

where `X` is the module that you want to use.

**Please refer to the [documentation](http://caffeinalab.github.io/Trimethyl/) for full-usage**.

Each module read the `Alloy.CFG.__MODULENAME__` properties in your *config.json* file to configure itself.

## NON-CommonJS modules

There are some modules that's cannot be included via *require*, and you have to use in your XML Alloy files, like:

* **xp.ui**: Provide cross-platforms UI elements to handle differences between platforms
* **ui**: Provide new UI elements that missing from some platforms

**Please refer to the [documentation](http://caffeinalab.github.io/Trimethyl/) for full-usage**.

## Essential (3)-party widgets

Some modules needs this modules, so you have to install if you get some errors:

* https://github.com/CaffeinaLab/com.caffeinalab.titanium.loader
* https://github.com/CaffeinaLab/com.caffeinalab.titanium.modalwindow

You can install via **gittio**:

```
gittio install com.caffeinalab.titanium.loader;
gittio install com.caffeinalab.titanium.modalwindow;
```

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
