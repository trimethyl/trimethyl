/**
 * @module 	fb
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Array} [config.permissions=[]] Array of permissions
 */
exports.config = _.extend({
	permissions: [],
}, Alloy.CFG.T ? (Alloy.CFG.T.fb || Alloy.CFG.T.facebook) : {});

var Util = require('T/util');
var _FB = Util.requireOrNull('facebook');

var dispatcher = _.extend({}, Backbone.Events);

if (_FB) {

	// Hydratate module

	/**
	 * @method fetchUser
	 * @param {Object} opt
	 * @param {String} [opt.fields='name,email,first_name,last_name'] The fields of the user to fetch
	 * @param {Function} opt.success Success callback to invoke
	 * @param {Function} opt.error Error callback to invoke
	 */
	_FB.fetchUser = function(opt) {
		opt = _.defaults(opt || {}, {
			fields: 'name,email,first_name,last_name'
		});

		_FB.requestWithGraphPath('me', { fields: opt.fields }, 'GET', function(e) {
			if (e.success && e.result != null) {
				if (_.isFunction(opt.success)) opt.success(JSON.parse(e.result));
			} else {
				if (_.isFunction(opt.error)) opt.error(e);
			}
		});
	};

	// Setup permissions
	if (!_.isEmpty(exports.config.permissions)) {
		_FB.permissions = exports.config.permissions;
	}

	// Setup login events and forward to internal JS dispatcher
	
	/**
	 * @method  addLoginListener
	 * @param {Function} callback)
	 */
	_FB.addLoginListener = function(callback) {
		dispatcher.on('login', callback); 
	};

	/**
	 * @method  removeLoginListener
	 * @param  {Function} callback
	 */
	_FB.removeLoginListener = function(callback) { 
		dispatcher.off('login', callback); 
	};

	/**
	 * @method  addLogoutListener
	 * @param {Function} callback)
	 */
	_FB.addLogoutListener = function(callback) {
		dispatcher.on('logout', callback); 
	};

	/**
	 * @method 	removeLogoutListener
	 * @param  {Function} callback
	 */
	_FB.removeLogoutListener = function(callback) { 
		dispatcher.off('logout', callback); 
	};

	// Forward
	_FB.addEventListener('login', function(e) { 
		Ti.API.debug('FB: login fired', e);
		dispatcher.trigger('login', e); 
	});

	_FB.addEventListener('logout', function(e) { 
		Ti.API.debug('FB: logout fired', e);
		dispatcher.trigger('logout', e); 
	});

	// Initialize the SDK and login events
	_FB.initialize();

} else {

	Ti.API.error('FB: Facebook native module not found');

}

module.exports = _FB;