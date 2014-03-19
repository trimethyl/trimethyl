var FB = require('facebook');
var Auth = require('auth');
var config = {};

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

function onLogin(e) {
	if (timeout) {
		clearTimeout(timeout);
	}

	if (loginTimeout) {
		clearTimeout(loginTimeout);
	}

	if (!e.success) {
		return Ti.App.fireEvent('auth.fail', { message: e.error || L('auth_facebook_error', 'Facebook login failed for an unknown reason') });
	}

	Auth.login({
		access_token: FB.getAccessToken()
	}, 'facebook', function(){
		// We don't need to store nothing, because the Facebook SDK store internally all data.
	});
}

exports.handleLogin = function(){
	timeout = setTimeout(function(){
		return onLogin({ success:false });
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
			if (FB.loggedIn && FB.getAccessToken()) {
				return onLogin({ success:true });
			}

			FB.authorize();

		}, 5000);

	} else {
		if (FB.loggedIn && FB.getAccessToken()) {
			return onLogin({ success:true });
		}

		FB.authorize();
	}
};

exports.login = function(){
	FB.authorize();
};

exports.logout = function(){
	FB.logout();
};

exports.init = function(c){
	config = _.extend(config, c);

	FB.forceDialogAuth = false;
	if (!FB.appid) FB.appid = Ti.App.Properties.getString('ti.facebook.appid', false);
	if (config.permissions) FB.permissions = config.permissions.split(',');

	FB.addEventListener('login', function(e){
		cachedLoginEvent = e;
		if (require('network').isOnline() && !require('network').isServerConnected()) {
			console.warn("FB.login triggered before /ping");
			return false;
		}

		onLogin(cachedLoginEvent);

	});
};