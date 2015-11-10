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

var FB = require('T/fb'); // Use FB as an accessor
var Facebook = require('facebook'); // Use Facebook for the absolute module

if (OS_IOS) {
	// It seems that iOS (sometimes) doesn't trigger the login event
	// This is very bad, and this below is an hack, but it works:
	// We listen for the resumed event (it only happens when the Facebook.app is opened),
	// and in a defer call (with this trick we can assume that,
	// if in a future update Facebook will fix this issue,
	// its login event will be triggered before our function)
	// we re-fire the event with the minimal data we have
	Ti.App.addEventListener('resumed', function() {
		_.defer(function() {
			var currentSchema = Util.parseSchema();
			if (/^fb\d+\:\/\/authorize/.test(currentSchema)) {
				Facebook.fireEvent('login', {
					manualFire: true,
					success: Facebook.loggedIn,
					accessToken: Facebook.accessToken
				});
			}
		});
	});
}

var _opt = null;

exports.login = function(opt) {
	_opt = opt; // store globally

	if (Facebook.loggedIn) {
		_opt.success({
			access_token: Facebook.accessToken
		});
	} else {
		if (Ti.Network.online) {
			Facebook.authorize();
		} else {
			_opt.error({
				offline: true,
				message: L('network_offline', 'Check your connectivity.')
			});
		}
	}
};

exports.logout = function() {
	Facebook.logout();
};

exports.isStoredLoginAvailable = function() {
	return Facebook.loggedIn;
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success({
			access_token: Facebook.accessToken
		});
	} else {
		opt.error();
	}
};

/*
Init
*/

Facebook.addEventListener('login', function(e) {
	Ti.API.debug('Auth.Facebook: login fired', e);

	// This is a security hack caused by iOS SDK that automatically trigger the login event
	if (_opt == null) {
		return Ti.API.debug('Auth.Facebook: login prevented');
	}

	if (e.success) {
		_opt.success({
			access_token: Facebook.accessToken
		});
	} else {
		Facebook.logout();
		_opt.error({
			message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('unexpected_error', 'Unexpected error')
		});
	}

	// Reset _opt to prevent double triggers of callbacks
	_opt = null;
});
