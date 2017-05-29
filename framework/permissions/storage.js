/**
 * @module  permissions.storage
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.storage';

var Q = require('T/ext/q');

exports.request = function(success, error) {
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

		if (
			false === _.isFunction(Ti.Filesystem.hasStoragePermissions) || 
			false === _.isFunction(Ti.Filesystem.requestStoragePermissions)
		) {
			return resolve();
		}

		if (Ti.Filesystem.hasStoragePermissions() !== true) {
			return Ti.Filesystem.requestStoragePermissions(requestHandler);
		}

		resolve();
	});
};