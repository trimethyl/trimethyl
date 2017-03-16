/**
 * @module  permissions.calendar
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var hasFn = Ti.Calendar.hasCalendarPermissions;
var requestFn = Ti.Calendar.requestCalendarPermissions;

exports.request = function(success, error) {
	success = success || Alloy.Globals.noop;
	error = error || Alloy.Globals.noop;

	function requestHandler(res) {
		if (res.success === true) {
			success();
		} else {
			Ti.API.error('Permissions: Error while requesting calendar permissions:', res.error);
			error({ 
				message: L('error_calendar_permissions', 'Missing calendar permissions') 
			});
		}
	}

	if (false === _.isFunction(hasFn) || false === _.isFunction(requestFn)) {
		success();
		return;
	}

	if (hasFn !== true) {
		requestFn(requestHandler);
	} else {
		success();
	}
};