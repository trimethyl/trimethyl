/**
 * @class  	Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

Ti.Trimethyl = true;

// Framework loaders

Alloy.Globals.Trimethyl = {

	loadDriver: function(parent, child, interface) {
		var sub = require('T/'+parent+'/'+child);
		if (sub == null) {
			Ti.API.warn("Trimethyl: Unable to load driver <" + child + "> of class <" + parent + ">");
		}

		return _.extend({}, interface, sub);
	}

};

// Alloy Globals Contants

Alloy.Globals.SCREEN_WIDTH = OS_IOS ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
Alloy.Globals.SCREEN_HEIGHT = OS_IOS ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;
Alloy.Globals.SCREEN_DENSITY = OS_ANDROID ? Ti.Platform.displayCaps.logicalDensityFactor : Titanium.Platform.displayCaps.dpi/160;
Alloy.Globals.SIMULATOR = Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1;

Alloy.Globals.SCREEN_RETINA = Alloy.Globals.SCREEN_DENSITY == 2;
Alloy.Globals.IOS7 = OS_IOS && Ti.Platform.version.split('.')[0] == 7;
Alloy.Globals.IOS8 = OS_IOS && Ti.Platform.version.split('.')[0] == 8;

// Global App Listeners

Ti.App.addEventListener('openURL', function(e){
	Ti.Platform.openURL(e.url);
});