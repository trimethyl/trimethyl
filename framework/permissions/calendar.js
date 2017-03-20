/**
 * @module  permissions.calendar
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

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

	if (false === _.isFunction(Ti.Calendar.hasCalendarPermissions) || false === _.isFunction(Ti.Calendar.requestCalendarPermissions)) {
		success();
		return;
	}

	if (Ti.Calendar.hasCalendarPermissions() !== true) {
		Ti.Calendar.requestCalendarPermissions(requestHandler);
	} else {
		success();
	}
};