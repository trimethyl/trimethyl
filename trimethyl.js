/**
 * @class  Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * The framework initializator
 */

var Util = require('T/util');
var Device = require('T/device');
var Event = require('T/event');

var launchURL = Util.parseSchema();
var pauseURL = null;

Ti.App.addEventListener('pause', function(){
	pauseURL = launchURL;
	Event.trigger('app.paused');
});

Ti.App.addEventListener('resumed', function() {
	launchURL = Util.parseSchema();

	if (launchURL !== pauseURL) {
		Event.trigger('app.resumed', {
			url: launchURL
		});
	}
});


// Set some TSS vars

Alloy.Globals.SCREEN_WIDTH = Device.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT = Device.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY = Device.getScreenDensity();
Alloy.Globals.SIMULATOR  = Device.isSimulator();

Alloy.Globals.SCREEN_RETINA = +Alloy.Globals.SCREEN_DENSITY === 2;
Alloy.Globals.IOS7 = Util.isIOS7();
Alloy.Globals.IOS8 = Util.isIOS8();
