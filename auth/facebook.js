/**
 * @class  Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Facebook authentication
 */

/**
 * * `authTimeout`: Timeout for logging in
 * @type {Object}
 */
var config = _.extend({
	authTimeout: 10000
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;

var FB = require('T/facebook');
var Auth = require('T/auth');
var Event = require('T/event');

var calledAuthorize = false; // Flag to stop iOS automatic login on app startup
var loginTimeout = null; // Timeout for logging in
var successLogin = null; // Callback when login success
var silent = true; // Flag passed to `Auth.login` and `auth.fail` event


function loginToServer() {
	clearTimeout(loginTimeout);

	Auth.login({
		access_token: FB.accessToken,
		silent: silent
	}, 'facebook', successLogin);
}

function authorize() {
	if (FB.loggedIn === true && ! _.isEmpty(FB.accessToken)) {
		loginToServer();
	} else {
		calledAuthorize = true;
		FB.authorize();
	}
}

/**
 * Login using Facebook SDK and make the request to the API server, silently
 */
function handleLogin() {
	silent = true;
	calledAuthorize = false;

	// Prevent app freezing
	loginTimeout = setTimeout(function(){
		Event.trigger('auth.fail', {
			silent: silent,
			message: L('auth_facebook_error')
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


/*
Init
*/

FB.forceDialogAuth = false;
FB.addEventListener('login', function(e) {
	// by checking the `calledAuthorize` flag, we are sure that loginToServer is NOT called automatically on startup.
	// This is a security hack caused by iOS SDK that automatically trigger the login event
	if (calledAuthorize === false) {
		return Ti.API.debug('Auth.Facebook: login prevented due falsity of calledAuthorize flag');
	}

	if (e.success === true) {

		Ti.API.debug('Auth.Facebook: SUCCESS', e);
		loginToServer();

	} else {

		Ti.API.error('Auth.Facebook: ERROR', e);
		Event.trigger('auth.fail', {
			silent: silent,
			message: (e.error && e.error.indexOf('OTHER:') !== 0) ? e.error : L('auth_facebook_error')
		});

	}

});
