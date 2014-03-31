/*

Trimethyl
Author: Flavio De Stefano
Company: Caffeina SRL

*/

// Load the modules
_.each(Alloy.CFG.autoConfModules || [], function(m){
	require(m).init( Alloy.CFG[m] || {} );
});

// Set the parse schema

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
		if (launchURL!=pauseURL) {
			Ti.App.fireEvent('app.resumed', { url: launchURL });
		}
	});

}

// Set some TSS vars

Alloy.Globals.SCREEN_WIDTH = Util.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT = Util.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY = Util.getScreenDensity();

Alloy.Globals.IOS7 = Util.isIOS7();

exports.getLaunchURL = function() {
	return launchURL;
};