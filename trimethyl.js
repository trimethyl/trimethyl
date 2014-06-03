/**
 * @class  Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * The framework initializator
 */

var Util = require('util');
var Device 	= require('device');

var launchURL = Util.parseSchema();
var pauseURL = null;

if (OS_IOS) {

	Ti.App.addEventListener('pause', function(){
		pauseURL = launchURL;
		Ti.App.fireEvent('app.paused');
	});

	Ti.App.addEventListener('resumed', function() {
		launchURL = Util.parseSchema();
		if (launchURL!==pauseURL) {
			Ti.App.fireEvent('app.resumed', { url: launchURL });
		}
	});

}

// Set some TSS vars
//
Alloy.Globals.SCREEN_WIDTH 		= Device.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT 		= Device.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY 		= Device.getScreenDensity();
Alloy.Globals.IOS7 					= Util.isIOS7();

// Prototype!

String.prototype.zeroFy = function(n) {
	if (this.length<=n) {
		var zeros = ''; for (var i=0; i<n; i++) zeros += '0';
		return zeros + this.toString();
	}
	return this.toString();
};