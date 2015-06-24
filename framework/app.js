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
	return !Ti.App.Properties.hasProperty('app.firstuse');
};

/**
 * @method setAppFirstUse
 * Set the app first usage date.
 *
 * Use in conjunction with {@link #isFirstUse}
 */
exports.setFirstUse = function() {
	Ti.App.Properties.setString('app.firstuse', Util.now());
};

/**
 * @method start
 */
exports.start = function() {
	Ti.API.info('App: Started with schema <' + exports.launchURL + '>');
	if (!exports.config.useRouter) return;
	if (exports.launchURL == null) return;

	Router.go(exports.launchURL);
};

/**
 * @method notifyUpdate
 * Check on the App/Play store if new version of this app has been released.
 * If it is, a dialog is shown to update the app.
 */
exports.notifyUpdate = function() {
	if (!Ti.Network.online) return;

	var url = null;
	if (OS_IOS) {
		url = 'https://itunes.apple.com/lookup?bundleId=' + Ti.App.id;
	} else if (OS_ANDROID) {
		url = 'https://androidquery.appspot.com/api/market?app=' + Ti.App.id;
	} else {
		return;
	}

	require('T/http').send({
		url: url,
		errorAlert: false,
		format: 'json',
		success: function(response) {
			if (response == null || !_.isObject(response)) return;

			var new_version = null;
			if (OS_IOS) {
				new_version = (response.results && response.results[0]) ? response.results[0].version : null;
			} else if (OS_ANDROID) {
				new_version = response.version || null;
			}

			var version_compare = Util.compareVersions(new_version, Ti.App.version);

			Ti.API.info('Util: App store version is ' + new_version);
			Ti.API.info('Util: Current version is ' + Ti.App.version);

			if (version_compare > 0) {
				require('T/dialog').confirm(
				L('app_new_version_title', 'Update available'),
				String.format(L('app_new_version_message', 'A new version of %s is available: %s'), Ti.App.name, new_version), [
				{
					title: L('app_new_version_button_later', 'Later'),
					callback: function() {
						require('T/ga').trackEvent('updatedialog', 'later');
					}
				},
				{
					title: L('app_new_version_button_update', 'Update'),
					selected: true,
					callback: function() {
						Util.openInStore( OS_IOS ? response.results[0].trackId : Ti.App.id );
					}
				}
				]);
			}
		}
	});
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

	if (exports.pauseURL === exports.launchURL) return;
	if (!exports.config.useRouter) return;

	Router.go(exports.launchURL);
});
