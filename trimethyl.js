/*

Trimethyl
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var Alloy = require('alloy'),
_ = require("alloy/underscore")._,
Backbone = require("alloy/backbone");

var Util = require('util');
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

var Device 	= require('device');

// Set some TSS vars

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