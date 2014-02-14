var config = {};
var drivers = {};

var Network = require('network');
var authInfo = null;
var Me = null;

function getCurrentDriver(){
	if (!Ti.App.Properties.hasProperty('auth.driver')) return false;
	return Ti.App.Properties.getString('auth.driver');
}

exports.loadDriver = loadDriver = function(d) {
	if (!d) return false;
	if (drivers[d]) return drivers[d];
	try {
		drivers[d] = require('auth.'+d);
		drivers[d].init(config.drivers[d]);
	} catch (e) { return false; }
	return drivers[d];
};

function loadCurrentDriver() {
	return loadDriver(getCurrentDriver());
}

exports.handleLogin = function(){
	var driver = loadCurrentDriver();
	if (!driver) return Ti.App.fireEvent('app.login');
	try { driver.handleLogin(); }
	catch (e) { Ti.App.fireEvent('app.login'); }
};

exports.login = login = function(data, driver, cb) {
	data.method = driver;
	Network.send({
		url: '/auth',
		method: 'POST',
		data: data,
		success: function(response){
			authInfo = response;

			Me = require('alloy').createModel('user', { id: authInfo.id });
			Me.fetch({
				networkArgs: { refresh:true },
				ready: function(){

					Ti.App.Properties.setObject('auth.me', Me.toJSON());
					Ti.App.Properties.setString('auth.driver', driver);

					Ti.App.fireEvent('auth.success', authInfo);
					if (cb) cb();
				},
				mistake: function(msg){
					Ti.App.fireEvent('auth.fail', { message: (msg || L('auth.fail', 'Authentication failed')) });
				}
			});
		},
		error: function(msg){
			Ti.App.fireEvent('auth.fail', { message: (msg || L('auth.fail', 'Authentication failed')) });
		}
	});
};

exports.getAuthInfo = function(){
	return authInfo;
};

exports.user = exports.me = function(){
	return Me;
};

exports.logout = logout = function() {
	var id = null;
	if (Me) id = Me.get('id');

	var Driver = loadCurrentDriver();
	if (Driver) Driver.logout();

	Ti.App.Properties.removeProperty('auth.me');
	Ti.App.Properties.removeProperty('auth.driver');
	Network.resetCache();

	Me = null;
	authInfo = null;

	Network.send({
		url: '/logout',
		method: 'POST',
		disableEvent: true,
		complete: function(){
			Network.resetCookies();
			Ti.App.fireEvent('auth.logout', { id: id });
		},
		success: function(){},
		error: function(){}
	});
};

exports.init = init = function(c){
	config = _.extend(config, c);
};