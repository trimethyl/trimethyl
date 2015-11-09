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

var FB = require('T/fb');

var _opt = null;

exports.login = function(opt) {
	_opt = opt; // store globally

	if (FB.loggedIn === true && FB.accessToken != null) {
		_opt.success({
			access_token: FB.accessToken
		});
	} else {
		if (Ti.Network.online) {
			FB.authorize();
		} else {
			_opt.error({
				offline: true,
				message: L('network_offline', 'Check your connectivity.')
			});
		}
	}
};

exports.logout = function() {
	FB.logout();
};

exports.isStoredLoginAvailable = function() {
	return FB.loggedIn === true && FB.accessToken != null;
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success({
			access_token: FB.accessToken
		});
	} else {
		opt.error();
	}
};

/*
Init
*/

FB.addEventListener('login', function(e) {
	Ti.API.debug('Auth.Facebook: login fired', e);

	// This is a security hack caused by iOS SDK that automatically trigger the login event
	if (_opt == null) {
		return Ti.API.debug('Auth.Facebook: login prevented');
	}

	if (e.success) {
		_opt.success({
			access_token: FB.accessToken
		});
	} else {
		FB.logout();
		_opt.error({
			message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('unexpected_error', 'Unexpected error')
		});
	}

	// Reset _opt to prevent double triggers of callbacks
	_opt = null;
});


