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

var localOptions = null;

function storeData() {
	Ti.App.Properties.setObject('auth.facebook.data', {
		accessToken: _FB.accessToken,
		expirationDate: _FB.expirationDate
	});
}

exports.login = function(opt) {
	localOptions = opt; // store globally

	if (_FB.loggedIn) {
		storeData();
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
	return _FB.loggedIn || Ti.App.Properties.hasProperty('auth.facebook.data');
};

exports.storedLogin = function(opt) {
	if (_FB.loggedIn) {
		storeData();
		opt.success({
			access_token: _FB.accessToken
		});
	} else {
		opt.error();
	}
};

/*
Init
*/

_FB.addLoginListener(function(e) {
	Ti.API.debug('Auth.Facebook: login fired', e);

	if (e.success) {
		storeData();
	} else {
		// If there's some errors, reset
		exports.logout();
	}

	// This is a security hack caused by iOS SDK that automatically trigger the login event
	// We don't need that is event is triggered on startup: to detect login,
	// just call `Auth.login({ driver: 'facebook' })`
	if (localOptions == null) {
		Ti.API.warn('Auth.Facebook: login prevented');
	} else {

		if (e.success) {
			localOptions.success({
				access_token: _FB.accessToken
			});
		} else {
			localOptions.error({
				message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('unexpected_error', 'Unexpected error')
			});
		}

		// Reset localOptions to prevent double triggers of callbacks
		localOptions = null;

	}
});
