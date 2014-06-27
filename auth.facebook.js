/**
 * @class  Auth.Facebook
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Facebook authentication
 */

/**
 * * **appid**: Application ID. Default: `null`
 * * **permissions**: Array of permissions. Default: `[]`
 * @type {Object}
 */
var config = _.extend({
	appid: null,
	permissions: []
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;


var FB = require('facebook');
var Auth = require('T/auth');

var authorized = false;
var lastEvent = null;
var timeout = null;
var successLogin = null;
var silent = true;

function loginToServer(e) {
	if (timeout) clearTimeout(timeout);
	if (e.cancelled) return;

	if (!e.success) {

		Ti.API.error("Auth.Facebook: "+e);
		Ti.App.fireEvent('auth.fail', {
			silent: silent,
			message: L('auth_facebook_error')
		});

	} else {

		Ti.API.debug("Auth.Facebook: success");
		Auth.login({
			access_token: FB.accessToken,
			silent: silent
		}, 'facebook', successLogin);
	}
}

function authorize() {
	if (FB.loggedIn && FB.accessToken) {
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
		return loginToServer({ success: false });
	}, 10000);

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

	// If there's an error, try the legacy mode of Facebook login, that we are sure that works.
	if (lastEvent && !lastEvent.success) {
		FB.forceDialogAuth = true;
	}

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

	if (!FB.appid) {
		if (config.appid) {
			FB.appid = config.appid;
		} else if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);	// Legacy mode
		} else {
			Ti.API.warn("Auth.Facebook: Please specify a Facebook AppID");
		}
	}

	if (config.permissions) {
		FB.permissions = _.isArray(config.permissions) ? config.permissions : config.permissions.split(',');
	}

	FB.addEventListener('login', function(e){
		lastEvent = e;

		/*
		checking the authorized flag, we are sure that loginToServer is not called automatically on startup,
		because on iOS the SDK automatically trigger the login event
		*/
		if (authorized) loginToServer(e);
	});

})();