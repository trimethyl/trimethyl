// Load all modules
var Alloy = require('alloy');

var loadedModules = {};
var modules = _.difference(
	_.union(Alloy.CFG.autoConfModules||[], Alloy.CFG.additionalAutoConfModules||[]),
	Alloy.CFG.excludedAutoConfModules||[]);
_.each(modules, function(m){
	if (m in loadedModules) {
		console.warn("Can't load this module, already loaded");
		return;
	}
	loadedModules[m] = require(m);
	loadedModules[m].init(Alloy.CFG[m]||{});
});

// Manage pause and resume events

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
Alloy.Globals.IOS7 = U.isIOS7();

exports.getLoadedModules = function(){
	return loadedModules;
};

exports.getLaunchURL = function() {
	return launchURL;
};