/**
 * @module  permissions
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

/*
Include methods used in this module dynamically to avoid that Titanium 
static analysis doesn't include native-language methods.
 */
Ti.Calendar;
Ti.Media;
Ti.Contacts;
Ti.Geolocation;
Ti.Filesystem;

/**
 * @property config
 */
exports.config = _.extend({
	// Placeholder for future configurations
}, Alloy.CFG.T ? Alloy.CFG.permissions : {});

var PERMISSIONS_TYPES = [
	{ name: 'Calendar', proxy: 'Calendar'},
	{ name: 'Camera', proxy: 'Media'},
	{ name: 'Contacts', proxy: 'Contacts'},
	{ name: 'Location', proxy: 'Geolocation'},
	{ name: 'Storage', proxy: 'Filesystem'}
];

PERMISSIONS_TYPES.forEach(function(type) {
	exports['request' + type.name + 'Permissions'] = function(success, error) {
		success = _.isFunction(success) ? success : Alloy.Globals.noop;
		error = _.isFunction(error) ? error : Alloy.Globals.noop;



		var has, request;
		switch (type.name) {
			case 'Calendar':
				has     = Ti.Calendar.hasCalendarPermissions;
				request = Ti.Calendar.requestCalendarPermissions;
				break;

			case 'Camera':
				has     = Ti.Media.hasCameraPermissions;
				request = Ti.Media.requestCameraPermissions;
				break;

			case 'Contacts':
				has     = Ti.Contacts.hasContactsPermissions;
				request = Ti.Contacts.requestContactsPermissions;
				break;

			case 'Location':
				has     = Ti.Geolocation.hasLocationPermissions;
				request = Ti.Geolocation.requestLocationPermissions;
				break;

			case 'Storage':
				has     = Ti.Filesystem.hasStoragePermissions;
				request = Ti.Filesystem.requestStoragePermissions;
				break;
		}

		function requestHandler(res) {
			if (res.success === true) {
				success();
			} else {
				Ti.API.error('Permissions: Error while requesting ' + type.name + ' permissions:', res.error);
				error({ 
					message: L('error_' + type.name.toLowerCase() + '_permissions', 'Missing ' + type.name.toLowerCase() + ' permissions') 
				});
			}
		}

		if (false == _.isFunction(Ti[type.proxy]["has" + type.name + "Permissions"]) || false == _.isFunction(Ti[type.proxy]["request" + type.name + "Permissions"])) {
			Ti.API.debug('Either of the functions [Ti.' + type.proxy + '.has' + type.name + 'Permissions(), Ti.' + type.proxy + '.request' + type.name + 'Permissions()] is missing');
			success();
			return;
		}

		if (Ti[type.proxy]["has" + type.name + "Permissions"]() !== true) {
			Ti[type.proxy]["request" + type.name + "Permissions"](requestHandler);
		} else {
			success();
		}
	};
});
