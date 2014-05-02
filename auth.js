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
	if (!Ti.App.Properties.hasProperty('auth.driver')) return false;
	return Ti.App.Properties.getString('auth.driver');
}

function loadDriver(d) {
	return require('auth.'+d);
}
exports.loadDriver = loadDriver;

function loadCurrentDriver() {
	return loadDriver(getCurrentDriver());
}

exports.handleLogin = function(){
	var driver = loadCurrentDriver();
	try {
		driver.handleLogin();
	} catch (e) {
		Ti.App.fireEvent('app.login');
	}
};

exports.handleOfflineLogin = function(cb){
	if (!Ti.App.Properties.hasProperty('auth.me')) {
		Ti.App.fireEvent('app.login');
		return;
	}

	Me = Alloy.createModel('user', Ti.App.Properties.getObject('auth.me'));
	Ti.App.fireEvent('auth.success');
	if (cb) cb();
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

			Me = Alloy.createModel('user', {
				id: authInfo.id
			});

			Me.fetch({
				networkArgs: { refresh: true },

				success: function(){
					Ti.App.Properties.setObject('auth.me', Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);
					Ti.App.fireEvent('auth.success', authInfo);

					if (cb) cb();
				},

				error: function(e){
					Ti.App.fireEvent('auth.fail', { message: e.message });
				}
			});
		},
		error: function(e){
			Ti.App.fireEvent('auth.fail', { message: e.message });
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
	if (!Me) return;

	var id = Me.get('id');

	try {
		loadCurrentDriver().logout();
	} catch (e) {
		console.error("Auth driver error: "+e);
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
			info: { mime:'json' },
			silent: true,
			complete: function(){
				require('net').resetCookies();
				Ti.App.fireEvent('auth.logout', { id: id });
			},
			success: function(){},
			error: function(){} // suppress all errors
		});
	} else {
		require('net').resetCookies();
		Ti.App.fireEvent('auth.logout', { id: id });
	}
}
exports.logout = logout;