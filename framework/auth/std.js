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

var MODULE_DATA_NAME = 'auth.std.data';

var Prop = require('T/prop');

exports.__setParent = function(parent) {
	exports.__parent = parent;
};

function getData() {
	return Prop.getObject(MODULE_DATA_NAME);
}

function hasData() {
	return Prop.hasProperty(MODULE_DATA_NAME);
}

function storeData(value) {
	Prop.setObject(MODULE_DATA_NAME, value);
}

function removeData() {
	Prop.removeProperty(MODULE_DATA_NAME);
}

exports.login = function(opt) {
	if (opt.data == null) {
		throw new Error('Auth: set data when calling Auth.login');
	}

	storeData(opt.data);
	opt.success(opt.data);
};

exports.logout = function() {
	removeData();
};

exports.isStoredLoginAvailable = function() {
	return hasData();
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success(getData());
	} else {
		opt.error();
	}
};