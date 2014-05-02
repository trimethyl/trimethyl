/*

Auth Facebook module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var FB = require('facebook');
var Auth = require('auth');
var config = _.extend({}, Alloy.CFG.auth ? Alloy.CFG.auth.facebook : {});

/*
This variable is needed to balance the differences between iOS & Android
On IOS, if the user is logged in, the Facebook library automatically trigger a 'login' event in FB.
But we need to check is the server is connected before the auth request, so we store globally this object
to use when we need. On Android, the behavior is different, the library doesn't trigger anything
so we simple trigger the FB.authorize() to regrant permissions and start the auth cycle.
*/
var cachedLoginEvent = null;
var loginTimeout = null;
var timeout = null;
var successLogin = null;
var silent = true;

function onLogin(e) {
	if (timeout) clearTimeout(timeout);
	if (loginTimeout) clearTimeout(loginTimeout);
	if (!e.success) {
		return Ti.App.fireEvent('auth.fail', {
			message: e.error || L('auth_facebook_error')
		});
	}

	Auth.login({
		access_token: FB.accessToken,
		silent: silent
	}, 'facebook', function(){
		if (successLogin) successLogin();
	});
}

exports.handleLogin = function(){
	silent = true;

	timeout = setTimeout(function(){
		return onLogin({ success: false });
	}, 10000);

	if (OS_IOS) {
		if (cachedLoginEvent) {
			return onLogin(cachedLoginEvent);
		}

		/*
		if there's no cachedLoginEvent, we wait for the library to trigger automatically the event
		But, we are on Titanium, and we know that nothing works fine.. So we just put a timeout
		that call the FB.authorize() method. Manually.
		*/
		loginTimeout = setTimeout(function(){
			if (FB.loggedIn && FB.accessToken) {
				onLogin({ success:true });
			} else {
				FB.authorize();
			}
		}, 5000);

	} else {

		if (FB.loggedIn && FB.accessToken) {
			onLogin({ success:true });
		} else {
			FB.authorize();
		}

	}
};

exports.login = function(success){
	silent = false;
	successLogin = success;

	// If there's an error, try the legacy mode of Facebook login, that we are sure that works.
	if (cachedLoginEvent && !cachedLoginEvent.success) {
		FB.forceDialogAuth = true;
	}

	if (FB.loggedIn && FB.accessToken) {
		onLogin({ success: true });
	} else {
		FB.authorize();
	}
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
		FB.permissions = config.permissions.split(',');
	}

	FB.addEventListener('login', function(e){
		cachedLoginEvent = e;

		var Net = require('net');
		if (Net.usePingServer()) {
			if (Net.isOnline() && !Net.isServerConnected()) {
				console.warn("FB.login triggered before /ping");
				return false;
			}
		}

		onLogin(cachedLoginEvent);
	});

})();