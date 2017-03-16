/**
 * @module  permissions.storage
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var hasFn = Ti.Filesystem.hasStoragePermissions;
var requestFn = Ti.Filesystem.requestStoragePermissions;

exports.request = function(success, error) {
	success = success || Alloy.Globals.noop;
	error = error || Alloy.Globals.noop;

	function requestHandler(res) {
		if (res.success === true) {
			success();
		} else {
			Ti.API.error('Permissions: Error while requesting storage permissions:', res.error);
			error({ 
				message: L('error_storage_permissions', 'Missing storage permissions') 
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