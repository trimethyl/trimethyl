/**
 * @class  Auth
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Authentication module interfaced with an API server
 *
 * This module works with global events.
 *
 * Listen for
 *
 * * `auth.success`: Login success
 * * `auth.fail`: Login failed
 * * `auth.logut`: User want to logout
 * * `auth.login`: The app has no stored credentials
 *
 * then just call `T('auth').handleLogin()` in the `alloy.js`
 * file and wait for one of 4 events.
 *
 */

/**
 * * `loginUrl` URL to login-in
 * * `logoutUrl` URL to logout
 * @type {Object
 */
var config = _.extend({
	loginUrl: '/login',
	logoutUrl: '/logout'
}, Alloy.CFG.T.auth);
exports.config = config;


var HTTP = require('T/http');
var Event = require('T/event');


/**
 * @property Me
 * Current user model
 * @type {Backbone.Model}
 */
exports.Me = null;

/**
 * @property authInfo
 * Authentication info processed during login
 * @type {Object}
 */
exports.authInfo = null; // auth info stored


/**
 * Require the selected driver
 *
 * @param  {String} driver The driver
 * @return {Object}
 */
function load(driver) {
	return require('T/auth/'+driver);
}
exports.load = load;


/**
 * Get the stored driver as String
 *
 * @return {String}
 */
function getCurrentDriver(){
	if (Ti.App.Properties.hasProperty('auth.driver') === false) {
		return null;
	}
	return Ti.App.Properties.getString('auth.driver');
}
exports.getCurrentDriver = getCurrentDriver;


/**
 * Trigger the handleLogin on current-used driver
 *
 */
function handleOnlineLogin() {
	var currentDriver = getCurrentDriver();

	if (currentDriver === null) {
		return Ti.API.warn('Auth: no driver stored to handle authentication');
	}

	try {
		return load(currentDriver).handleLogin();
	} catch (err) {
		Event.trigger('app.login', { message: err });
	}
}
exports.handleOnlineLogin = handleOnlineLogin;


/**
 * Try to login in offline mode,
 * filling the user information from offline data
 *
 * Trigger an `app.login` event in case of no offline data is present;
 * otherwise, an `auth.success` event is triggered
 *
 * @param  {Function} success Success callback
 */
function handleOfflineLogin(success) {
	if (Ti.App.Properties.hasProperty('auth.me') === false) {
		return Event.trigger('app.login');
	}

	var authData = Ti.App.Properties.getObject('auth.me');
	if (!_.isObject(authData)) {
		return Event.trigger('app.login');
	}

	// Create the User model
	exports.Me = Alloy.createModel('user', authData);

	Event.trigger('auth.success');
	if (_.isFunction(success)) success();
}
exports.handleOfflineLogin = handleOfflineLogin;


/**
 * Try to login, switching automatically to offline mode
 * if an internet connection is not detected
 *
 * If it fails, it fails silently.
 *
 */
function handleLogin() {
	if (HTTP.isOnline()) {
		handleOnlineLogin();
	} else {
		handleOfflineLogin();
	}
}
exports.handleLogin = handleLogin;


function getUserModel(data, callback) {
	exports.Me = Alloy.createModel('user', {
		id: exports.authInfo.id
	});

	exports.Me.fetch({
		http: {
			refresh: true,
			cache: false,
			silent: data.silent
		},
		success: callback,
		error: function(e){
			Event.trigger('auth.fail', {
				message: e.message,
				silent: data.silent
			});
		}
	});
}


/**
 * Login in the API server
 *
 * Trigger an *auth.fail* in case of fail
 *
 * Trigger an *auth.success* if success
 *
 * @param  {Object}   data   Data sent to the server
 * @param  {String}   driver Driver used to login
 * @param  {Function} callback     Success callback
 */
function login(data, driver, callback) {
	HTTP.send({
		url: config.loginUrl,
		method: 'POST',
		data: _.extend(data, { method: driver }),
		silent: data.silent,
		success: function(response){
			exports.authInfo = response || {};

			if (exports.authInfo.id != null) {

				getUserModel(data, function() {
					Ti.App.Properties.setObject('auth.me', exports.Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);
					Event.trigger('auth.success', exports.authInfo);

					if (_.isFunction(callback)) callback(exports.authInfo);
				});

			} else {

				Ti.API.error('Auth: authInfo.id is null');
				Event.trigger('auth.fail', {
					message: L('auth_error'),
					silent: data.silent
				});

			}
		},
		error: function(e){
			Event.trigger('auth.fail', {
				message: e.message,
				silent: data.silent
			});
		},
	});
}
exports.login = login;


/**
 * @method getUser
 * Get current User model
 * @return {Object}
 */
exports.getUser = function(){
	return exports.Me;
};

/**
 * @method user
 * @inheritDoc #getUser
 * Alias for {@link #getUser}
 */
exports.user = exports.getUser;

/**
 * @method getUserID
 * Get current User ID
 * @return {Number}
 */
function getUserID(){
	if (exports.Me == null) return null;
	return exports.Me.id;
}
exports.getUserID = getUserID;


/**
 * Logout calling "current-driver" logout, logout from the API server and empty all auth infos
 *
 * Trigger an *auth.logout* in any case when completed
 *
 * @param  {Function} callback Success callback
 */
function logout(callback) {
	var id = getUserID();
	var currentDriver = getCurrentDriver();

	try {
		load(currentDriver).logout();
	} catch (err) {}

	exports.Me = null;
	exports.authInfo = null;

	// Remove stored infos
	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');

	// Remove cache, because can contain sensibile data
	HTTP.Cache.prune();

	var onLogoutComplete = function() {
		HTTP.resetCookies();
		Event.trigger('auth.logout', { id: id });
		if (_.isFunction(callback)) callback();
	};

	if (HTTP.isOnline()) {

		HTTP.send({
			url: config.logoutUrl,
			method: 'POST',
			silent: true,
			success: function(){},
			error: function(){},
			complete: onLogoutComplete
		});

	} else {
		onLogoutComplete();
	}

}
exports.logout = logout;


/**
 * Check if the user is logged in
 *
 * @return {Boolean}
 */
exports.isLoggedIn = function() {
	return exports.Me !== null;
};
