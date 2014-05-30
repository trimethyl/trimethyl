# Trimethyl

### Alloy-Titanium framework made in [Caffeina](http://caffeinalab.com)

A collection of very useful modules to work with Appcelerator Titanium and Alloy.

Most of these modules are proxy object for Titanium API and some of these add features missing or expose functions usefuls for UI normalization.

![image](http://f.cl.ly/items/3l1F2O1E0O1s0V38402p/trimelogo.png)

# [http://caffeinalab.github.io/Trimethyl/](API Documentation)

## Installation

To install this framework, you have to **replace** your lib directory.

So, open terminal, move to your Titanium project, and type

```
git clone git@github.com:CaffeinaLab/Trimethyl.git app/lib
```

All your custom code out of the framework can be placed in `app/lib/app/*`, that is in .gitignore.

## Initialization

In your *app/alloy.js* file, do something like:

```javascript
var Framework = require('trimethyl');
```

Now, just call

```javascript
var Net = require('net');
```

for each module you want to use.

Each module read the `Alloy.CFG.__MODULENAME__` properties in your *config.json* file to configure itself.

## Essential (3)-party widgets

* https://github.com/CaffeinaLab/com.caffeinalab.titanium.loader
* https://github.com/CaffeinaLab/com.caffeinalab.titanium.modalwindow

For certain modules, this widgets **are necessary**.

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
