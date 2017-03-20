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
			Ti.API.error('Permissions: Error while requesting camera permissions:', res.error);
			error({ 
				message: L('error_camera_permissions', 'Missing camera permissions') 
			});
		}
	}

	if (false === _.isFunction(Ti.Media.hasCameraPermissions) || false === _.isFunction(Ti.Media.requestCameraPermissions)) {
		success();
		return;
	}

	if (Ti.Media.hasCameraPermissions() !== true) {
		Ti.Media.requestCameraPermissions(requestHandler);
	} else {
		success();
	}
};