/**
 * @module  permissions.storage
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.storage';

var _ = require('alloy/underscore')._;
var Q = require('T/ext/q');

function requestPermissions(permissions, success, error) {
	return Q.promise(function(_resolve, _reject) {
		var resolve = function() {
			if (success != null) success.apply(null, arguments);
			_resolve.apply(null, arguments);
		};

		var reject = function() {
			if (error != null) error.apply(null, arguments);
			_reject.apply(null, arguments);
		};

		function requestHandler(e) {
			if (e.success === true) {
				resolve();
			} else {
				Ti.API.error(MODULE_NAME + ': Error while requesting Storage permissions - ' + e.error);
				reject({
					message: L('error_storage_permissions', 'Missing storage permissions')
				});
			}
		}

		if (_.isEmpty(permissions)) {
			Ti.API.error(MODULE_NAME + ': Error while requesting Storage permissions - No permission defined');
			reject({
				message: 'No permission defined',
			});
		}

		if (!OS_ANDROID) {
			return resolve();
		}

		return permissions.map(function(permission) {
			if (Ti.Android.hasPermission(permission)) return Q.resolve();

			return Ti.Android.requestPermissions(permission, requestHandler);
		})
		.reduce(Q.when, Q())
		.then(resolve);
	});
}

exports.request = function(success, error) {
	return requestPermissions([
		"android.permission.READ_EXTERNAL_STORAGE",
		"android.permission.WRITE_EXTERNAL_STORAGE"
	], success, error);
};

exports.requestRead = function(success, error) {
	return requestPermissions([
		"android.permission.READ_EXTERNAL_STORAGE",
	], success, error);
};

exports.requestWrite = function(success, error) {
	return requestPermissions([
		"android.permission.WRITE_EXTERNAL_STORAGE"
	], success, error);
};