/**
 * @module  permissions.phone
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.phone';

var _ = require('alloy/underscore')._;
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
				Ti.API.error(MODULE_NAME + ': Error while requesting Phone permissions - ' + e.error);
				reject({ 
					message: L('error_phone_permissions', 'Missing Phone permissions') 
				});
			}
		}

		if (
			OS_IOS ||
			false === _.isFunction(Ti.Android.hasPermission) || 
			false === _.isFunction(Ti.Android.requestPermissions)
		) {
			return resolve();
		}

		if (Ti.Android.hasPermission('android.permission.CALL_PHONE') !== true) {
			return Ti.Android.requestPermissions(['android.permission.CALL_PHONE'], requestHandler);
		}

		resolve();
	});
};