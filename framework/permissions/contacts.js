/**
 * @module  permissions.contacts
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var hasFn = Ti.Media.hasContactsPermissions;
var requestFn = Ti.Media.requestContactsPermissions;

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