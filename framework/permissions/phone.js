/**
 * @module  permissions.phone
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

exports.request = function(success, error) {
	success = success || Alloy.Globals.noop;
	error = error || Alloy.Globals.noop;

	function requestHandler(res) {
		if (res.success === true) {
			success();
		} else {
			Ti.API.error('Permissions: Error while requesting phone permissions:', res.error);
			error({
				message: L('error_phone_permissions', 'Missing phone permissions')
			});
		}
	}

	if (OS_IOS || false === _.isFunction(Ti.Android.hasPermission) || false === _.isFunction(Ti.Android.requestPermissions)) {
		success();
		return;
	}

	if (Ti.Android.hasPermission('android.permission.CALL_PHONE') !== true) {
		Ti.Android.requestPermissions(['android.permission.CALL_PHONE'], requestHandler);
	} else {
		success();
	}
};
