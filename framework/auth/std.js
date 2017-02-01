/**
 * @module  auth/std
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.loginUrl=false] Override URL to login-in
 */
exports.config = _.extend({
	loginUrl: false
}, (Alloy.CFG.T && Alloy.CFG.T.auth) ? Alloy.CFG.T.auth.std : {});

function getData() {
	return require('T/auth').getPersistence().getObject('auth.std.data');
}

function storeData(value) {
	require('T/auth').getPersistence().setObject('auth.std.data', value);
}

exports.login = function(opt) {
	if (opt.data == null) {
		throw new Error('Auth: set data when calling Auth.login');
	}

	require('T/auth').getPersistence().setObject('auth.std.data', opt.data);
	opt.success(opt.data);
};

exports.logout = function() {
	require('T/auth').getPersistence().removeProperty('auth.std.data');
};

exports.isStoredLoginAvailable = function() {
	return require('T/auth').getPersistence().hasProperty('auth.std.data');
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success(require('T/auth').getPersistence().getObject('auth.std.data'));
	} else {
		opt.error();
	}
};