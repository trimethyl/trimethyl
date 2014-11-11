/**
 * @class  	App
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} 	[config.useRouter=true]		Auto-route using the Router class.
 */
exports.config = _.extend({
	useRouter: true,
}, Alloy.CFG.T ? Alloy.CFG.T.app : {});

var Util = require('T/util');
var Prop = require('T/prop');
var Router = require('T/router');

/**
 * @property {String} launchURL
 */
exports.launchURL = Util.parseSchema();

/**
 * @property {String} pauseURL
 */
exports.pauseURL = null;

/**
 * @method isFirstUse
 * Check if the first open of the app.
 *
 * Call @{@link #setFirstUse} to set the first use of the app.
 *
 * @return {Boolean}
 */
exports.isFirstUse = function() {
	return !Prop.hasProperty('app.firstuse');
};

/**
 * @method setAppFirstUse
 * Set the app first usage date.
 *
 * Use in conjunction with {@link #isFirstUse}
 */
exports.setFirstUse = function() {
	Prop.setString('app.firstuse', Util.now());
};

/*
Init
*/

Ti.App.addEventListener('pause', function(){
	exports.pauseURL = exports.launchURL;
	Ti.API.debug('App: Paused');
});

Ti.App.addEventListener('resumed', function() {
	exports.launchURL = Util.parseSchema();
	Ti.API.debug('App: Resumed with schema <' + exports.launchURL + '>');

	if (exports.launchURL !== exports.pauseURL && exports.config.useRouter) {
		Router.go(exports.launchURL);
	}
});

/**
 * @method start
 */
exports.start = function() {
	Ti.API.debug('App: Started with schema <' + exports.launchURL + '>');
	if (exports.config.useRouter && exports.launchURL != null) {
		Router.go(exports.launchURL);
	}
};
