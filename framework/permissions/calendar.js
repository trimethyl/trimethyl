/**
 * @module  permissions.calendar
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.calendar';

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
				Ti.API.error(MODULE_NAME + ': Error while requesting calendar permissions - ' + e.error);
				reject({ 
					message: L('error_calendar_permissions', 'Missing calendar permissions') 
				});
			}
		}

		if (
			false === _.isFunction(Ti.Calendar.hasCalendarPermissions) || 
			false === _.isFunction(Ti.Calendar.requestCalendarPermissions)
		) {
			return resolve();
		}

		if (Ti.Calendar.hasCalendarPermissions() !== true) {
			return Ti.Calendar.requestCalendarPermissions(requestHandler);
		}

		resolve();
	});
};