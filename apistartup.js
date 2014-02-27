var Network = require('network');
var config = {};

exports.handle = function(){
	if (Network.isOnline()) {
		Network.connectToServer(function(){
			require('auth').handleLogin();
		});
	} else {
		require('auth').handleOfflineLogin();
	}
};

exports.init = function(c, channel){
	config = _.extend(config, c);
};