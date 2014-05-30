/**
 * @class  Auth.Std
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Standard authentication
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.auth ? Alloy.CFG.auth.std : {});
exports.config = config;


var Net = require('net');
var Auth = require('auth');

/**
 * Login to the API server using stored data
 */
function handleLogin(){
	var data = Ti.App.Properties.getObject('auth.std.data');
	data.silent = true;
	Auth.login(data, 'std');
}
exports.handleLogin = handleLogin;


/**
 * Login to the API server
 *
 * @param {Object} data Data passed to API
 * @param  {Function} success Callback when login success
 */
function login(data, cb) {
	Auth.login(data, 'std', function(){
		Ti.App.Properties.setObject('auth.std.data', data);
		if (cb) cb();
	});
}
exports.login = login;


/**
 * Remove any user data
 *
 */
function logout(){
	Ti.App.Properties.removeProperty('auth.std.data');
}
exports.logout = logout;


/**
 * Signup to the API server
 *
 * @param  {Object}   data Data passed to API
 * @param  {Function} cb   Success callback
 */
function signup(data, cb) {
	Net.send({
		url: '/signup',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
}
exports.signup = signup;


/**
 * Send the *password lost* request to the API server
 *
 * @param  {Object}   data Data passed to API
 * @param  {Function} cb   Success callback
 */
function lost(data, cb){
	Net.send({
		url: '/lost',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
}
exports.lost = lost;