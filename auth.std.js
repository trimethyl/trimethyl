/*

Auth Standard module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.auth ? Alloy.CFG.auth.std : {});
var Net = require('net');
var Auth = require('auth');


exports.handleLogin = function(){
	var data = Ti.App.Properties.getObject('auth.std.data');
	data.silent = true;
	require('auth').login(data, 'std');
};

exports.login = function(data, cb) {
	Auth.login(data, 'std', function(){
		Ti.App.Properties.setObject('auth.std.data', data);
		if (cb) cb();
	});
};

exports.logout = function(){
	Ti.App.Properties.removeProperty('auth.std.data');
};

exports.signup = function(data, cb) {
	Net.send({
		url: '/signup',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
};

exports.lost = function(data, cb){
	Net.send({
		url: '/lost',
		method: 'POST',
		data: data,
		success: function(){
			if (cb) cb();
		}
	});
};