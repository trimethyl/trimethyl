/**
 * @module  auth/bypass
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 */
exports.config = {};

exports.__setParent = function(parent) {
	exports.__parent = parent;
};

exports.login = function(opt) {
	opt.success(opt.data);
};

exports.logout = function() {
};

exports.isStoredLoginAvailable = function() {
	return true;
};

exports.storeData = function() {
};

exports.storedLogin = function(opt) {
	opt.success();
};