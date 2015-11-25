/**
 * @class  	Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl=false] Override URL to login-in
 */
exports.config = _.extend({
	loginUrl: false
}, (Alloy.CFG.T && Alloy.CFG.T.auth) ? Alloy.CFG.T.auth.facebook : {});

var Util = require('T/util');
var _FB = require('T/fb'); // Use FB as an accessor

if (OS_IOS) {
	// It seems that iOS (sometimes) doesn't trigger the login event
	// This is very bad, and this below is an hack, but it works:
	// We listen for the resumed event (it only happens when the Facebook.app is opened),
	// and in a defer call (with this trick we can assume that,
	// if in a future update Facebook will fix this issue,
	// its login event will be triggered before our function)
	// we re-fire the event with the minimal data we have
	Ti.App.addEventListener('resumed', function() { _.defer(function() {
		var currentSchema = Util.parseSchema();
		if (/^fb\d+\:\/\/authorize/.test(currentSchema)) {
			_FB.fireEvent('login', {
				manualFire: true,
				success: _FB.loggedIn,
				accessToken: _FB.accessToken
			});
		}
	}); });
}

var localOptions = null;

exports.login = function(opt) {
	localOptions = opt; // store globally

	if (_FB.loggedIn) {
		localOptions.success({
			access_token: _FB.accessToken
		});
	} else {
		_FB.authorize();
	}
};

exports.logout = function() {
	Ti.App.Properties.removeProperty('auth.facebook.data');
	_FB.logout();
};

exports.isStoredLoginAvailable = function() {
	return Ti.App.Properties.hasProperty('auth.facebook.data');
};

exports.storedLogin = function(opt) {
	exports.login(opt);
};

/*
Init
*/

_FB.addEventListener('login', function(e) {
	Ti.API.debug('Auth.Facebook: login fired', e);

	// This is a security hack caused by iOS SDK that automatically trigger the login event
	// We don't need that is event is triggered on startup: to detect login,
	// just call `Auth.login({ driver: 'facebook' })`
	if (localOptions == null) {
		return Ti.API.warn('Auth.Facebook: login prevented');
	}

	if (e.success) {

		Ti.App.Properties.setObject('auth.facebook.data', {
			accessToken: _FB.accessToken,
			expirationDate: _FB.expirationDate
		});

		localOptions.success({
			access_token: _FB.accessToken
		});

	} else {
		_FB.logout();
		localOptions.error({
			message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('unexpected_error', 'Unexpected error')
		});
	}

	// Reset localOptions to prevent double triggers of callbacks
	localOptions = null;
});
