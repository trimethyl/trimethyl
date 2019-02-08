/**
 * @module  app
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 * @property {Boolean} [config.enqueueRouteWithUniversalLink=true] 	Auto enqueue route with Universal link
 * @property {Boolean} [config.enqueueRouteWithDeepLink=true] 			Auto enqueue route with deep link
 */
exports.config = _.extend({
	enqueueRouteWithUniversalLink: true,
	enqueueRouteWithDeepLink: true,
	autoStart: true
}, Alloy.CFG.T ? Alloy.CFG.T.app : {});

var Util = require('T/util');
var Router = require('T/router');

var wasPaused = false;

/**
 * A static method used to convert a Universal link to a route
 * With its default implementation, the original incoming string is return.
 * You can override this function to get a different behaviour
 * @param  {String} url The URL
 * @return {String} The route
 */
exports.universalLinkToRoute = function(url) { return url; };

/**
 * A static method used to convert a Deep link to a route
 * With its default implementation, the original incoming string is return
 * You can override this function to get a different behaviour
 * @param  {String} url The URL
 * @return {String} The route
 */
exports.deepLinkToRoute = function(url) { return url; };

/**
 * Check if the first opening of the app.
 * Call {@link setFirstUse} to set the first use of the app.
 * @param {String} [prefix=""] A prefix to apply
 * @return {Boolean}
 */
exports.isFirstUse = function(prefix) {
	prefix = prefix || '';
	return !Ti.App.Properties.hasProperty('app.firstuse' + prefix);
};

/**
 * Set the app first usage date.
 * @param {String} [prefix=""] A prefix to apply
 * Use in conjunction with {@link isFirstUse}
 */
exports.setFirstUse = function(prefix) {
	prefix = prefix || '';
	Ti.App.Properties.setString('app.firstuse' + prefix, Util.now());
};

/**
 * Check on the App/Play store (or on a your distributed URL) if new version of this app has been released.
 * If it is, a dialog is shown to prompt the user for the update.
 * On iOS, all three parameters are auto-generated based on the app ID to check against the App Store.
 * On Android, there's no a reliable method to check this on the Play Store, so you have to
 * specify it manually the URL (maybe on a server where you handle the current version) and the other two parameters.
 * For In-House applications or Development application, you have to do the same.
 * @param  {String} 	[url=null] 			The URL to use to check for the update.
 * @param  {Function} 	[version_cb=null] 	The function to call that handles the parsing of the response. It must returns the version.
 * @param  {Function} 	[success_cb=null] 	The function to call when the user clicks: "Update"
 * @param  {Function} 	[cancel_cb=null] 	The function to call when the user clicks: "Cancel"
 */
exports.notifyUpdate = function(url, version_cb, success_cb, cancel_cb) {
	if (!Ti.Network.online) return;

	var HTTP = require('T/http');
	var Dialog = require('T/dialog');

	if (url == null) {
		if (OS_IOS) {
			url = 'https://itunes.apple.com/lookup?bundleId=' + Ti.App.id;
		} else {
			return null;
		}
	}

	version_cb = version_cb || function(response) {
		if (OS_IOS) {
			return (response.results && response.results[0]) ? response.results[0].version : null;
		} else {
			return null;
		}
	};

	success_cb = success_cb || function(response) {
		Util.openInStore((function() {
			if (OS_IOS) return response.results[0].trackId;
			else return null;
		})() );
	};

	cancel_cb = cancel_cb || Alloy.Globals.noop;

	HTTP.send({
		url: url,
		cache: false,
		format: 'json',
		success: function(response) {
			if (response == null || !_.isObject(response)) {
				cancel_cb({ error: true });
				return;
			}

			var new_version = version_cb(response);
			var version_compare = Util.compareVersions(new_version, Ti.App.version);

			Ti.API.info('Util: App store version is ' + new_version);
			Ti.API.info('Util: Current version is ' + Ti.App.version);

			if (version_compare > 0) {
				var title = L('app_new_version_title', 'Update available');
				var message = String.format(L('app_new_version_message', 'A new version of %s is available: %s'), Ti.App.name, new_version);

				Dialog.confirm(title, message, [
				{
					title: L('app_new_version_button_later', 'Later'),
					callback: function() {
						cancel_cb(response);
					}
				},
				{
					title: L('app_new_version_button_update', 'Update'),
					preferred: true,
					callback: function() {
						success_cb(response);
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

function deepLinkHandler(e) {
	var url = Util.parseSchema();
	var urlToRoute = exports.deepLinkToRoute(url);

	if (OS_IOS && exports.config.enqueueRouteWithUniversalLink) {
		if (e && e.activityType === 'NSUserActivityTypeBrowsingWeb') {
			urlToRoute = !e.webpageURL || exports.universalLinkToRoute(e.webpageURL);
		}
	} else {
		Ti.API.info('App: Started/Resumed with schema <' + url + '>');
	}

	Router.enqueue(urlToRoute);
}


exports.start = function() {
	if (OS_IOS) {
		if (exports.config.enqueueRouteWithDeepLink) {
			// The "resume" event is to handle all incoming deep links
			Ti.App.addEventListener("resumed", function(e) {
				if (wasPaused) {
					wasPaused = false;
					deepLinkHandler(e);
				}
			});

			Ti.App.addEventListener("paused", function (e) {
				wasPaused = true;
			});
		}

		if (exports.config.enqueueRouteWithUniversalLink) {
			// This one "continueactivity.NSUserActivityTypeBrowsingWeb", handle Universal Links
			Ti.App.iOS.addEventListener("continueactivity", deepLinkHandler);
		}
	}

	deepLinkHandler();
};

if (exports.config.autoStart) {
	exports.start();
}
