/**
 * @class  Auth.Std
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


exports.login = function(opt) {
	Ti.App.Properties.setObject('auth.std.data', opt.data);
	opt.success(opt.data);
};

exports.logout = function(callback) {
	Ti.App.Properties.removeProperty('auth.std.data');
	if (_.isFunction(callback)) callback();
};

exports.isStoredLoginAvailable = function() {
	return Ti.App.Properties.hasProperty('auth.std.data');
};

exports.storedLogin = function(opt) {
	if (exports.isStoredLoginAvailable()) {
		opt.success(Ti.App.Properties.getObject('auth.std.data'));
	} else {
		opt.error();
	}
};