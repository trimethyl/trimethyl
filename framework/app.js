/**
 * @class  	App
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 */
exports.config = _.extend({
}, Alloy.CFG.T ? Alloy.CFG.T.app : {});

var Util = require('T/util');
var Router = require('T/router');

var launchURL = null;

/**
 * @method isFirstUse
 * Check if the first open of the app.
 *
 * Call {@link #setFirstUse} to set the first use of the app.
 *
 * @return {Boolean}
 */
exports.isFirstUse = function() {
	return !Ti.App.Properties.hasProperty('app.firstuse');
};

/**
 * @method setFirstUse
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
	if (launchURL != null) {
		Ti.API.info('App: Started with schema <' + launchURL + '>');
		Router.go(launchURL);
		launchURL = null;
	}
};

/**
 * @method notifyUpdate
 * Check on the App/Play store if new version of this app has been released.
 * If it is, a dialog is shown to update the app.
 * @param  {String} 		url
 * @param  {Function} 	version_callback
 * @param  {Function} 	success_callback
 */
exports.notifyUpdate = function(url, version_callback, success_callback) {
	if (!Ti.Network.online) return;

	if (url == null) {
		if (OS_IOS) {
			url = 'https://itunes.apple.com/lookup?bundleId=' + Ti.App.id;
		} else if (OS_ANDROID) {
			url = 'https://androidquery.appspot.com/api/market?app=' + Ti.App.id;
		} else {
			return;
		}
	}

	version_callback = version_callback || function(response) {
		if (OS_IOS) {
			return (response.results && response.results[0]) ? response.results[0].version : null;
		} else if (OS_ANDROID) {
			return response.version || null;
		}
	};

	success_callback = success_callback || function(response) {
		Util.openInStore( OS_IOS ? response.results[0].trackId : Ti.App.id );
	};

	require('T/http').send({
		url: url,
		errorAlert: false,
		format: 'json',
		success: function(response) {
			if (response == null || !_.isObject(response)) return;

			var new_version = version_callback(response);
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
						success_callback(response);
					}
				}
				]);
			}
		}
	});
};


//////////
// Init //
//////////

Ti.App.addEventListener('resumed', function() {
	var launchURL = Util.parseSchema();
	if (launchURL != null) {
		Ti.API.info('App: Resumed with schema <' + launchURL + '>');
		Router.go(launchURL);
		launchURL = null;
	}
});

launchURL = Util.parseSchema();
