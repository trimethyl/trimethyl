/**
 * @module  auth/bypass
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 */
exports.config = {};

exports.login = function(opt) {
	opt.success(opt.data);
};

exports.logout = function() {
};

exports.isStoredLoginAvailable = function() {
	return true;
};

exports.storedLogin = function(opt) {
	opt.success();
};