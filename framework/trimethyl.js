/**
 * @module  trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

Ti.Trimethyl = true;
Alloy.CFG.T = Alloy.CFG.T || {};

///////////////////////
// Framework loaders //
///////////////////////

Alloy.Globals.Trimethyl = {

	loadDriver: function(parent, child, intf) {
		var sub = require('T/' + parent + '/' + child);
		if (sub == null) {
			Ti.API.warn("Trimethyl: Unable to load driver <" + child + "> of class <" + parent + ">");
		}

		return _.extend({}, intf, sub);
	}

};


////////////////////////////
// Alloy Globals Contants //
////////////////////////////

Alloy.Globals.noop = function() {};

Alloy.Globals.SCREEN_WIDTH = OS_IOS ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
Alloy.Globals.SCREEN_HEIGHT = OS_IOS ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;

Alloy.Globals.SCREEN_DENSITY = OS_ANDROID ? Ti.Platform.displayCaps.logicalDensityFactor : Titanium.Platform.displayCaps.dpi/160;
Alloy.Globals.SCREEN_RETINA = Alloy.Globals.SCREEN_DENSITY == 2;

Alloy.Globals.SIMULATOR = Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1;

Alloy.Globals.IOS7 = OS_IOS && Ti.Platform.version.split('.')[0] == 7;
Alloy.Globals.IOS8 = OS_IOS && Ti.Platform.version.split('.')[0] == 8;
Alloy.Globals.IOS9 = OS_IOS && Ti.Platform.version.split('.')[0] == 9;

//////////////////////////
// Global App Listeners //
//////////////////////////

Ti.App.addEventListener('openURL', function(e){
	Ti.Platform.openURL(e.url);
});

if (!ENV_DEVELOPMENT) {
	Ti.App.addEventListener('uncaughtException', function(e) {
		Ti.API.error(e.message + ' @ ' + e.source + ':' + e.line);
		require('T/ga').exception(e.message + ' @ ' + e.source + ':' + e.line);
	});
}

/////////////////////////////////////////////
// Extend underscore with awesome features //
/////////////////////////////////////////////

_.mixin({
	deepClone: function(object) {
		var clone = _.clone(object);
		_.each(clone, function(value, key) {
			if (_.isObject(value)) {
				clone[key] = _.deepClone(value);
			}
		});
		return clone;
	}
});
