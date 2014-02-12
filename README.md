# Trimethyl

### Alloy-Titanium framework made in Caffeina

![image](http://f.cl.ly/items/3N362x290A333O2U293Y/tr.png)

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

And all modules set in *config.json* are loaded.

**You can use all modules too without *autoConfModules*, just call `require("MODULE");'**

## Modules

* [Auth](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/auth.md)
* [Events](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/events.md)
* [Flow](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/flow.md)
* [GA](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/ga)
* [Geo](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/geo.md)
* [Map](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/map.md)
* [Network](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/network.md)
* [NewRelic](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/newrelic.md)
* [Notifications](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/notifications.md)
* [Share](https://github.com/CaffeinaLab/Trimethyl/blob/master/docs/share.md)

## Credits

* **xp.ui.js** forked from https://github.com/FokkeZB/UTiL/tree/master/xp.ui
* **share.js** forked from https://github.com/FokkeZB/UTiL/tree/master/share 

## Useful 3-party widgets

* https://github.com/FokkeZB/nl.fokkezb.loading


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
