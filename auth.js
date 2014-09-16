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
 * then just call `T('auth').handle()` in the `alloy.js` file and wait for one of 4 events.
 *
 */

var config = _.extend({
}, Alloy.CFG.T.auth);
exports.config = config;


var Me = null;
var authInfo = null;

var HTTP = require('T/http');
var Event = require('T/event');

function getCurrentDriver(){
	if (!Ti.App.Properties.hasProperty('auth.driver')) {
		return false;
	}
	return Ti.App.Properties.getString('auth.driver');
}

/**
 * Require the selected driver
 *
 * @param  {String} driver The driver
 * @return {Object}
 */
function loadDriver(driver) {
	return require('T/auth.'+driver);
}
exports.loadDriver = loadDriver;


/**
 * Require current-used driver, false if no driver is stored
 *
 * @return {Object}
 */
function loadCurrentDriver() {
	return loadDriver(getCurrentDriver());
}
exports.loadCurrentDriver = loadCurrentDriver;


/**
 * Trigger the handleLogin on current-used driver
 *
 */
function handleLogin() {
	if (!getCurrentDriver()) {
		Ti.API.warn("Auth: no driver stored to handle authentication");
		return false;
	}

	try {
		loadCurrentDriver().handleLogin();
	} catch (e) {
		Event.trigger('app.login');
	}
}
exports.handleLogin = handleLogin;


/**
 * Try to login in offline mode, filling the user information from offline data
 *
 * Trigger an **app.login** event in case of no offline data is present
 *
 * Otherwise, an **auth.success** event is triggered
 *
 * @param  {Function} success Success callback
 */
function handleOfflineLogin(success){
	if (!Ti.App.Properties.hasProperty('auth.me')) {
		Event.trigger('app.login');
		return;
	}

	Me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));
	Event.trigger('auth.success');
	if (success) success();
}
exports.handleOfflineLogin = handleOfflineLogin;


/**
 * Try to login, switching automatically to offline mode
 * if an internet connection is not detected
 *
 * If fail, it fails silently
 *
 */
function handle() {
	if (HTTP.isOnline()) {
		if (HTTP.usePingServer()) {
			HTTP.connectToServer(handleLogin);
		} else {
			handleLogin();
		}
	} else {
		handleOfflineLogin();
	}
}
exports.handle = handle;


/**
 * Login in the API server
 *
 * Trigger an *auth.fail* in case of fail
 *
 * Trigger an *auth.success* if success
 *
 * @param  {Object}   data   Data sent to the server
 * @param  {String}   driver Driver used to login
 * @param  {Function} cb     Success callback
 */
function login(data, driver, cb) {
	data.method = driver;

	HTTP.send({
		url: '/auth',
		method: 'POST',
		data: data,
		silent: data.silent || false,
		success: function(response){
			authInfo = response;

			if (!authInfo.id) {
				Ti.API.error("Auth: authInfo.id is null");
				Event.trigger('auth.fail', {
					message: L('auth_error'),
					silent: data.silent
				});
				return;
			}

			Me = Alloy.createModel('user', {
				id: authInfo.id
			});

			Me.fetch({
				http: {
					refresh: true,
					cache: false,
					silent: data.silent
				},

				success: function(){
					Ti.App.Properties.setObject('auth.me', Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);
					Event.trigger('auth.success', authInfo);

					if (cb) cb();
				},

				error: function(e){
					Event.trigger('auth.fail', {
						message: e.message,
						silent: data.silent
					});
				}
			});
		},
		error: function(e){
			Event.trigger('auth.fail', {
				message: e.message,
				silent: data.silent
			});
		}
	});
}
exports.login = login;


/**
 * Get the object returned from the API server when authenticated
 *
 * @return {Object}
 */
function getAuthInfo() {
	return authInfo;
}
exports.getAuthInfo = getAuthInfo;


/**
 * Get current User model
 * @return {Object}
 */
function getCurrentUser(){
	return Me;
}
exports.getCurrentUser = getCurrentUser;

/**
 * @method  me
 * @inheritDoc #getCurrentUser
 * Alias for {@link #getCurrentUser}
 */
exports.me = getCurrentUser;

/**
 * @method user
 * @inheritDoc #getCurrentUser
 * Alias for {@link #getCurrentUser}
 */
exports.user = getCurrentUser;

/**
 * Logout calling "current-driver" logout, logout from the API server and empty all auth infos
 *
 * Trigger an *auth.logout* in any case when completed
 *
 * @param  {Function} cb Success callback
 */
function logout(cb) {
	var id = Me ? Me.id: null;

	try {
		loadCurrentDriver().logout();
	} catch (e) {}

	Me = null;
	authInfo = null;

	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');
	HTTP.resetCache();

	if (HTTP.isOnline()) {

		HTTP.send({
			url: '/logout',
			method: 'POST',
			silent: true,
			success: function(){},
			error: function(){},
			complete: function(){
				HTTP.resetCookies();
				Event.trigger('auth.logout', { id: id });

				if (cb) cb();
			},
		});

	} else {

		HTTP.resetCookies();
		Event.trigger('auth.logout', { id: id });

	}

}
exports.logout = logout;

/**
 * Check if the user is logged in
 *
 * @return {Boolean}
 */
exports.isLogged = function() {
	return null !== Me;
};
