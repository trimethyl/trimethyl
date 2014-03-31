/*

Auth Standard module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var Auth = require('auth');
var config = {};

exports.handleLogin = function(){
	Auth.login(Ti.App.Properties.getObject('auth.std.data'), 'std');
};

exports.login = function(data){
	Auth.login(data, 'std', function(){
		Ti.App.Properties.setObject('auth.std.data', data);
	});
};

exports.logout = function(){
	Ti.App.Properties.removeProperty('auth.std.data');
};

exports.signup = function(data, cb) {
	require('net').send({
		url: '/signup',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
};

exports.lost = function(data, cb){
	require('net').send({
		url: '/lost',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
};

exports.init = function(c){
	config = _.extend(config, c);
};