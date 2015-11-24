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
 * @param {String} prefix A prefix to apply
 * @return {Boolean}
 */
exports.isFirstUse = function(prefix) {
	prefix = prefix || '';
	return !Ti.App.Properties.hasProperty('app.firstuse' + prefix);
};

/**
 * @method setFirstUse
 * Set the app first usage date.
 * @param {String} prefix A prefix to apply
 * Use in conjunction with {@link #isFirstUse}
 */
exports.setFirstUse = function(prefix) {
	prefix = prefix || '';
	Ti.App.Properties.setString('app.firstuse' + prefix, Util.now());
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
		} else {
			return null;
		}
	}

	version_callback = version_callback || function(response) {
		if (OS_IOS) {
			return (response.results && response.results[0]) ? response.results[0].version : null;
		} else {
			return null;
		}
	};

	success_callback = success_callback || function(response) {
		Util.openInStore((function() {
			if (OS_IOS) return response.results[0].trackId;
			else return null;
		})() );
	};

	require('T/http').send({
		url: url,
		errorAlert: false,
		cache: false,
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
