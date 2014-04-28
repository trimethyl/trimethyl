/*

API Startup module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.apistartup);

exports.handle = function(){
	var Net = require('net');

	if (Net.isOnline()) {
		Net.connectToServer(function(){
			require('auth').handleLogin();
		});
	} else {
		require('auth').handleOfflineLogin();
	}
};
