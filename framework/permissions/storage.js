/**
 * @module  permissions.storage
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

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

	if (false === _.isFunction(Ti.Filesystem.hasStoragePermissions) || false === _.isFunction(Ti.Filesystem.requestStoragePermissions)) {
		success();
		return;
	}

	if (Ti.Filesystem.hasStoragePermissions() !== true) {
		Ti.Filesystem.requestStoragePermissions(requestHandler);
	} else {
		success();
	}
};