/**
 * @class  Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Facebook authentication
 */

/**
 * * **appid**: Application ID. Default: `null`
 * * **permissions**: Array of permissions. Default: `[]`
 * * **authTimeout**: Timeout for logging in
 * @type {Object}
 */
var config = _.extend({
	appid: null,
	permissions: [],
	authTimeout: 10000
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;

var FB = require('facebook');
var Auth = require('T/auth');

var authorized = false; // Flag to stop iOS automatic login on app startup
var timeout = null; // Timeout for logging in
var successLogin = null; // Callback when login success
var silent = true; // Flag passed to `Auth.login` and `auth.fail` event


function loginToServer(e) {
	clearTimeout(timeout);
	if (e.cancelled === true) return;

	if (e.success !== true) {
		Ti.API.error('Auth.Facebook: ERROR', e);

		require('T/event').trigger('auth.fail', {
			silent: silent,
			message: L('auth_facebook_error')
		});
		return;
	}

	Ti.API.debug('Auth.Facebook: SUCCESS', e);
	Auth.login({
		access_token: FB.accessToken,
		silent: silent
	}, 'facebook', successLogin);
}

function authorize() {
	if (FB.loggedIn === true && ! _.isEmpty(FB.accessToken)) {
		loginToServer({ success: true });
	} else {
		authorized = true;
		FB.authorize();
	}
}

/**
 * Login using Facebook SDK and make the request to the API server, silently
 */
function handleLogin() {
	silent = true;
	authorized = false;

	// Prevent app freezing
	timeout = setTimeout(function(){
		loginToServer({
			success: false
		});
	}, config.authTimeout);

	authorize();
}
exports.handleLogin = handleLogin;


/**
 * Login using Facebook SDK and make the request to the API server
 *
 * @param  {Function} success Callback when login success
 */
function login(success){
	silent = false;
	successLogin = success;

	authorize();
}
exports.login = login;


/**
 * Remove any stored user data
 */
function logout() {
	FB.logout();
}
exports.logout = logout;


(function init(){

	FB.forceDialogAuth = false;

	if (FB.appid == null) {
		if (config.appid != null) {
			FB.appid = config.appid;
		} else if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);	// Legacy mode
		} else {
			Ti.API.warn('Auth.Facebook: Please specify a Facebook AppID');
		}
	}

	if (config.permissions != null) {
		FB.permissions = _.isArray(config.permissions) ? config.permissions : config.permissions.split(',');
	}

	FB.addEventListener('login', function(e){
		// by checking the `authorized` flag,
		// we are sure that loginToServer is NOT called automatically on startup.
		// This is a security hack caused by iOS SDK that
		// automatically trigger the login event
		if (authorized === false) {
			Ti.API.debug('Auth.Facebook: login prevented due authorized flag');
			return;
		}

		// If there's an error, and the user hasn't cancelled login,
		// try the legacy mode of Facebook login on next Login,
		// that we are SURE that works.
		if (e.error === true && e.cancelled === false) {
			Ti.API.warn('Auth.Facebook: enabling the legacy mode of Facebook login due error');
			FB.forceDialogAuth = true;
		}

		loginToServer(e);
	});

})();