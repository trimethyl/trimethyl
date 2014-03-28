/*

Trimethyl
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var Alloy = require('alloy');

// Load the modules
_.each(Alloy.CFG.autoConfModules || [], function(m){
	require(m).init( Alloy.CFG[m] || {} );
});

// Set the parse schema

var U = require('util');

var launchURL = U.parseSchema();
var pauseURL = null;

if (OS_IOS) {

	Ti.App.addEventListener('pause', function(){
		pauseURL = launchURL;
		Ti.App.fireEvent('app.paused');
	});

	Ti.App.addEventListener('resumed', function() {
		launchURL = U.parseSchema();
		if (launchURL!=pauseURL) {
			Ti.App.fireEvent('app.resumed', { url: launchURL });
		}
	});

}

// Set some TSS vars

Alloy.Globals.SCREEN_WIDTH = U.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT = U.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY = U.getScreenDensity();

Alloy.Globals.IOS7 = U.isIOS7();

exports.getLaunchURL = function() {
	return launchURL;
};