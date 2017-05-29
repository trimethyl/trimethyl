/**
 * @module  permissions.camera
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.camera';

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
				Ti.API.error(MODULE_NAME + ': Error while requesting camera permissions - ' + e.error);
				reject({ 
					message: L('error_camera_permissions', 'Missing camera permissions') 
				});
			}
		}

		if (
			false === _.isFunction(Ti.Media.hasCameraPermissions) || 
			false === _.isFunction(Ti.Media.requestCameraPermissions)
		) {
			return resolve();
		}

		if (Ti.Media.hasCameraPermissions() !== true) {
			return Ti.Media.requestCameraPermissions(requestHandler);
		}

		resolve();
	});
};