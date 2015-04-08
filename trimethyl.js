/**
 * @class  	Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

Ti.Trimethyl = true;

Alloy.Globals.Trimethyl = {

	loadDriver: function(parent, child, interface) {
		var sub = require('T/'+parent+'/'+child);
		if (sub == null) {
			Ti.API.warn("Trimethyl: Unable to load driver <" + child + "> of class <" + parent + ">");
		}

		return _.extend({}, interface, sub);
	}

};

// Init

var Device = require('T/device');

Alloy.Globals.SCREEN_WIDTH = Device.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT = Device.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY = Device.getScreenDensity();
Alloy.Globals.SIMULATOR  = Device.isSimulator();

Alloy.Globals.SCREEN_RETINA = +Alloy.Globals.SCREEN_DENSITY === 2;
Alloy.Globals.IOS7 = OS_IOS && Ti.Platform.version.split('.')[0] == 7;
Alloy.Globals.IOS8 = OS_IOS && Ti.Platform.version.split('.')[0] == 8;

Ti.App.addEventListener('openURL', function(e){
	Ti.Platform.openURL(e.url);
});