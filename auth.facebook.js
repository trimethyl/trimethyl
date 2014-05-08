/*

Auth Facebook module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.auth ? Alloy.CFG.auth.facebook : {});

var FB = require('facebook');
var Auth = require('auth');

var authorized = false;
var lastEvent = null;
var timeout = null;
var successLogin = null;
var silent = true;

function loginToServer(e) {
	if (timeout) clearTimeout(timeout);

	if (!e.success) {
		console.error(e);
		if (e.cancelled) return;

		Ti.App.fireEvent('auth.fail', {
			silent: silent,
			message: L('auth_facebook_error')
		});

	} else {

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

exports.handleLogin = function(){
	silent = true;
	authorized = false;

	// Prevent app freezing
	timeout = setTimeout(function(){
		return loginToServer({ success: false });
	}, 10000);

	authorize();
};

exports.login = function(success){
	silent = false;
	successLogin = success;

	// If there's an error, try the legacy mode of Facebook login, that we are sure that works.
	if (lastEvent && !lastEvent.success) {
		FB.forceDialogAuth = true;
	}

	authorize();
};

exports.logout = function(){
	FB.logout();
};

(function init(){
	FB.forceDialogAuth = false;

	if (!FB.appid) {
		if (config.appid) {
			FB.appid = config.appid;
		} else if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);	// Legacy mode
		} else {
			console.warn("Please specify a Facebook AppID");
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