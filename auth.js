/*

Auth module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.auth);
var drivers = {};

var Me = null;
var authInfo = null;
var Net = require('net');

function getCurrentDriver(){
	if (!Ti.App.Properties.hasProperty('auth.driver')) {
		return false;
	}

	return Ti.App.Properties.getString('auth.driver');
}

function loadDriver(d) {
	return require('auth.'+d);
}
exports.loadDriver = loadDriver;

function loadCurrentDriver() {
	return loadDriver(getCurrentDriver());
}

function handleLogin() {
	if (!getCurrentDriver()) {
		console.warn("No driver stored to handle authentication");
		return;
	}

	try {
		loadCurrentDriver().handleLogin();
	} catch (e) {
		Ti.App.fireEvent('app.login');
	}
}
exports.handleLogin = handleLogin;

function handleOfflineLogin(cb){
	if (!Ti.App.Properties.hasProperty('auth.me')) {
		Ti.App.fireEvent('app.login');
		return;
	}

	Me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));
	Ti.App.fireEvent('auth.success');
	if (cb) cb();
}
exports.handleOfflineLogin = handleOfflineLogin;


exports.handle = function() {
	if (Net.isOnline()) {
		if (Net.usePingServer()) {
			Net.connectToServer(handleLogin);
		} else {
			handleLogin();
		}
	} else {
		handleOfflineLogin();
	}
};

function login(data, driver, cb) {
	data.method = driver;

	Net.send({
		url: '/auth',
		method: 'POST',
		data: data,
		silent: data.silent,
		success: function(response){
			authInfo = response;
			if (!authInfo.id) {
				Ti.App.fireEvent('auth.fail', {
					message: L('auth_error'),
					silent: data.silent
				});
				return;
			}

			Me = Alloy.createModel('user', {
				id: authInfo.id
			});

			Me.fetch({
				networkArgs: {
					refresh: true,
					silent: data.silent
				},

				success: function(){
					Ti.App.Properties.setObject('auth.me', Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);
					Ti.App.fireEvent('auth.success', authInfo);

					if (cb) cb();
				},

				error: function(e){
					Ti.App.fireEvent('auth.fail', {
						message: e.message,
						silent: data.silent
					});
				}
			});
		},
		error: function(e){
			Ti.App.fireEvent('auth.fail', {
				message: e.message,
				silent: data.silent
			});
		}
	});
}
exports.login = login;

exports.getAuthInfo = function(){
	return authInfo;
};

exports.user = exports.me = function(){
	return Me;
};

function logout() {
	var id = Me ? Me.get('id') : null;

	if (getCurrentDriver()) {
		loadCurrentDriver().logout();
	}

	Me = null;
	authInfo = null;

	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');
	Net.resetCache();

	if (Net.isOnline()) {

		Net.send({
			url: '/logout',
			method: 'POST',
			silent: true,
			complete: function(){
				Net.resetCookies();
				Ti.App.fireEvent('auth.logout', { id: id });
			},
			success: function(){},
			error: function(){} // suppress all errors
		});

	} else {
		Net.resetCookies();
		Ti.App.fireEvent('auth.logout', { id: id });
	}

}
exports.logout = logout;