/**
 * @class  	Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var FB = require('T/fb');
var _opt = null;
var resumeListenerInstalled = false;

exports.login = function(opt) {
	_opt = opt; // store globally
	if (FB.loggedIn === true && FB.accessToken != null) {
		_opt.success({
			access_token: FB.accessToken
		});
	} else {
		if (Ti.Network.online) {
			FB.authorize();

			// Fix: SDK doesn't trigger login event.
			if (OS_IOS && resumeListenerInstalled === false) {
				resumeListenerInstalled = true;
				Ti.App.addEventListener('resumed', FB.authorize);
			}
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

FB.forceDialogAuth = false;
FB.addEventListener('login', function(e){
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


