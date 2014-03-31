/*

API Startup module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var Net = require('net');
var config = {};

exports.handle = function(){
	if (Net.isOnline()) {
		Net.connectToServer(function(){
			require('auth').handleLogin();
		});
	} else {
		require('auth').handleOfflineLogin();
	}
};

exports.init = function(c) {
	config = _.extend(config, c);
};