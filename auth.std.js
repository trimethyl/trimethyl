/*

Auth Standard module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.auth ? Alloy.CFG.auth.std : {});

exports.handleLogin = function(){
	require('auth').login(Ti.App.Properties.getObject('auth.std.data'), 'std');
};

exports.login = function(data, success){
	require('auth').login(data, 'std', function(){
		Ti.App.Properties.setObject('auth.std.data', data);
		if (cb) cb();
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