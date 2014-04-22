/*

Auth module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};
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
	if (!d) {
		return false;
	}

	if (drivers[d]) {
		return drivers[d];
	}

	try {
		drivers[d] = require('auth.'+d);
		drivers[d].init(config.drivers[d]);
	} catch (e) {
		return false;
	}

	return drivers[d];
};
exports.loadDriver = loadDriver;

function loadCurrentDriver() {
	return loadDriver(getCurrentDriver());
}

exports.handleLogin = function(){
	var driver = loadCurrentDriver();
	if (!driver) {
		return Ti.App.fireEvent('app.login');
	}

	try {
		driver.handleLogin();
	} catch (e) {
		Ti.App.fireEvent('app.login');
	}
};

exports.handleOfflineLogin = function(cb){
	if (!Ti.App.Properties.hasProperty('auth.me')) {
		return Ti.App.fireEvent('app.login');
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
		success: function(response){
			authInfo = response;

			Me = Alloy.createModel('user', { id: authInfo.id });
			Me.fetch({

				networkArgs: {
					refresh: true
				},

				ready: function(){
					Ti.App.Properties.setObject('auth.me', Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);
					Ti.App.fireEvent('auth.success', authInfo);
					if (cb) cb();
				},

				error: function(msg){
					Ti.App.fireEvent('auth.fail', { message: msg || L('auth_fail') });
				}

			});
		},
		error: function(msg){
			Ti.App.fireEvent('auth.fail', { message: msg || L('auth_fail') });
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
	if (!Me) {
		return;
	}

	var id = Me.get('id');

	try {
		var Driver = loadCurrentDriver();
		if (Driver) Driver.logout();
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
			info: {
				mime:'json'
			},
			disableEvent: true,
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


exports.init = init = function(c){
	config = _.extend(config, c);
};