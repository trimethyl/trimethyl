/**
 * @class  	App
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} [config.enqueueRouteWithUniversalLink=true] 	Auto enqueue route with Universal link
 * @property {Boolean} [config.enqueueRouteWithDeepLink=true] 			Auto enqueue route with deep link
 */
exports.config = _.extend({
	enqueueRouteWithUniversalLink: true,
	enqueueRouteWithDeepLink: true,
}, Alloy.CFG.T ? Alloy.CFG.T.app : {});

var Util = require('T/util');
var Router = require('T/router');

/**
 * @method universalLinkToRoute
 * @param  {String} url
 */
exports.universalLinkToRoute = function(url) { return url; };

/**
 * @method deepLinkToRoute
 * @param  {String} url
 */
exports.deepLinkToRoute = function(url) { return url; };

/**
 * @deprecated
 * @method start
 */
exports.start = function() { Ti.API.error('App: method start() is DEPRECATED!'); };

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

if (OS_IOS) {

	if (exports.config.enqueueRouteWithDeepLink) {
		// The "resume" event is to handle all incoming deep links
		Ti.App.addEventListener('resumed', function() {
			var url = Util.parseSchema();
			Ti.API.info('App: Resumed with schema <' + url + '>');
			
			if (url != null) {
				Router.go( exports.deepLinkToRoute(url) );
			}
		});
	}

	if (exports.config.enqueueRouteWithUniversalLink) {
		// This one "continueactivity.NSUserActivityTypeBrowsingWeb", handle Universal Links
		Ti.App.iOS.addEventListener('continueactivity', function(e) {
			if (e.activityType !== 'NSUserActivityTypeBrowsingWeb') return;
			if (e.webpageURL != null) {
				Router.enqueue( exports.universalLinkToRoute(e.webpageURL) );
			}
		});
	}

}

var url = Util.parseSchema();

if (url != null) {
	Ti.API.info('App: Started with schema <' + url + '>');

	if (exports.config.enqueueRouteWithDeepLink) {
		Router.enqueue( exports.deepLinkToRoute(url) );
	}
}
