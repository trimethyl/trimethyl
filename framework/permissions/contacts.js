/**
 * @module  permissions.contacts
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

exports.request = function(success, error) {
	success = success || Alloy.Globals.noop;
	error = error || Alloy.Globals.noop;

	function requestHandler(res) {
		if (res.success === true) {
			success();
		} else {
			Ti.API.error('Permissions: Error while requesting contacts permissions:', res.error);
			error({ 
				message: L('error_contacts_permissions', 'Missing contacts permissions') 
			});
		}
	}

	if (false === _.isFunction(Ti.Media.hasContactsPermissions) || false === _.isFunction(Ti.Media.requestContactsPermissions)) {
		success();
		return;
	}

	if (Ti.Media.hasContactsPermissions() !== true) {
		Ti.Media.requestContactsPermissions(requestHandler);
	} else {
		success();
	}
};