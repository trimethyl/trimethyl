/**
 * @module  permissions.contacts
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 * @author 	Flavio De Stefano <flavio.destefano@caffeina.com>
 */

var MODULE_NAME = 'permissions.contacts';

var _ = require('alloy/underscore')._;
var Q = require('T/ext/q');

exports.request = function(success, error) {
	return Q.promise(function(_resolve, _reject) {

		var resolve = function() { 
			if (success != null) success.apply(null, arguments);
			_resolve.apply(null, arguments); 
		};
		
		var reject = function() { 
			if (error != null) error.apply(null, arguments);
			_reject.apply(null, arguments); 
		};

		function requestHandler(e) {
			if (e.success === true) {
				resolve();
			} else {
				Ti.API.error(MODULE_NAME + ': Error while requesting Contacts permissions - ' + e.error);
				reject({ 
					message: L('error_contacts_permissions', 'Missing Contacts permissions') 
				});
			}
		}

		if (
			false === _.isFunction(Ti.Contacts.hasContactsPermissions) || 
			false === _.isFunction(Ti.Contacts.requestContactsPermissions)
		) {
			return resolve();
		}

		if (Ti.Contacts.hasContactsPermissions() !== true) {
			return Ti.Contacts.requestContactsPermissions(requestHandler);
		}

		resolve();
	});
};