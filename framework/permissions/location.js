/**
 * @module  permissions.location
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var hasFn = Ti.Geolocation.hasLocationPermissions;
var requestFn = Ti.Geolocation.requestLocationPermissions;

exports.request = function(success, error) {
	success = success || Alloy.Globals.noop;
	error = error || Alloy.Globals.noop;

	function requestHandler(res) {
		if (res.success === true) {
			success();
		} else {
			Ti.API.error('Permissions: Error while requesting location permissions:', res.error);
			error({ 
				message: L('error_location_permissions', 'Missing location permissions') 
			});
		}
	}

	if (false === _.isFunction(hasFn) || false === _.isFunction(requestFn)) {
		success();
		return;
	}

	if (hasFn() !== true) {
		requestFn(requestHandler);
	} else {
		success();
	}
};