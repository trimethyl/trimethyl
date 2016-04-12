/**
 * @class  	Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl=false] Override URL to login-in
 * @property {String} [config.tokenName="access_token"] The name of the Facebook access token as returned by this module
 */
exports.config = _.extend({
	loginUrl: false,
	tokenName: 'access_token'
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
		var res = {};
		res[exports.config.tokenName] = _FB.accessToken;
		localOptions.success(res);
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
		var res = {};
		res[exports.config.tokenName] = _FB.accessToken;
		opt.success(res);
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
			var res = {};
			res[exports.config.tokenName] = _FB.accessToken;
			localOptions.success(res);
		} else {
			localOptions.error({
				message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('unexpected_error', 'Unexpected error')
			});
		}

		// Reset localOptions to prevent double triggers of callbacks
		localOptions = null;

	}
});
