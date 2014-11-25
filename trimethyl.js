/**
 * @class  	Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Util = require('T/util');
var Device = require('T/device');

Alloy.Globals.SCREEN_WIDTH = Device.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT = Device.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY = Device.getScreenDensity();
Alloy.Globals.SIMULATOR  = Device.isSimulator();

Alloy.Globals.SCREEN_RETINA = +Alloy.Globals.SCREEN_DENSITY === 2;
Alloy.Globals.IOS7 = Util.isIOS7();
Alloy.Globals.IOS8 = Util.isIOS8();

Ti.App.addEventListener('openURL', function(e){
	Ti.Platform.openURL(e.url);
});