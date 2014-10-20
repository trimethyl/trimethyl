/**
 * @class  Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Facebook authentication
 */

var config = _.extend({
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;

var FB = require('T/facebook');

var _opt = null;

exports.login = function(opt) {
	_opt = opt;
	FB.authorize();
};

exports.logout = function(callback) {
	FB.logout();
	if (_.isFunction(callback)) callback();
};

exports.isStoredLoginAvailable = function() {
	return FB.loggedIn || !_.isEmpty(FB.accessToken);
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success({ access_token: FB.accessToken });
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

	if (e.success === true) {
		_opt.success({ access_token: FB.accessToken });
	} else {
		_opt.error({
			message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('auth_facebook_error')
		});
	}

	_opt = null;
});
