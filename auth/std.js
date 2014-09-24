/**
 * @class  Auth.Std
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Auth driver to handle Standard authentication
 */

var HTTP = require('T/http');
var Auth = require('T/auth');


/**
 * Login to the API server using stored data
 */
function handleLogin(){
	var data = Ti.App.Properties.getObject('auth.std.data') || {};
	data.silent = true;

	Auth.login(data, 'std');
}
exports.handleLogin = handleLogin;


/**
 * Login to the API server
 *
 * @param {Object} 		data 		Data passed to API
 * @param  {Function} 	success 	Callback when login success
 */
function login(data, success) {
	Auth.login(data, 'std', function(){
		Ti.App.Properties.setObject('auth.std.data', data);
		if (_.isFunction(success)) success();
	});
}
exports.login = login;


/**
 * Remove any user data
 */
function logout(){
	Ti.App.Properties.removeProperty('auth.std.data');
}
exports.logout = logout;


/**
 * Signup to the API server
 *
 * @param  {Object}   data Data passed to API
 * @param  {Function} callback   Success callback
 */
function signup(data, callback) {
	HTTP.send({
		url: '/signup',
		method: 'POST',
		data: data,
		success: callback
	});
}
exports.signup = signup;


/**
 * Send the *password lost* request to the API server
 *
 * @param  {Object}   data Data passed to API
 * @param  {Function} cb   Success callback
 */
function lost(data, callback){
	HTTP.send({
		url: '/lost',
		method: 'POST',
		data: data,
		success: callback
	});
}
exports.lost = lost;

/**
 * @method reset
 * @inheritDoc #lost
 * Alias for {@link #lost}
 */
exports.reset = lost;
