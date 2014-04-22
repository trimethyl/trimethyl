/*

Socket module
Author: Flavio De Stefano
Company: Caffeina SRL

*/
var config = {};

var Socket = function(args) {
	var self = this;

	this.__onRead = function(e) {
		if (e.bytesProcessed == -1) {
			if (args.onReadError) args.onReadError(e);
			console.error("Error, no byte processed");
			return;
		}

		try {
			if (e.buffer) {
				args.onRead(e.buffer.toString());
			}
		} catch (ex) {
			if (args.onReadError) args.onReadError(ex);
			console.error(ex);
		}
	};

	this.write = function(v, onSuccess) {
		Ti.Stream.write(self.$$, Ti.createBuffer({
			value: JSON.stringify(v)
		}), onSuccess || function(){});
	};

	this.close = function() {
		this.$$.close();
	};

	this.$$ = Ti.Network.Socket.createTCP({
		host: args.host,
		port: args.port,
		connected: function(e) {
			if (args.onRead) {
				Ti.Stream.pump(e.socket, self.__onRead, 1024, true);
			}

			if (args.success) args.success();
		},
		error: function (e) {
			if (args.error) args.error(e);
		},
	});

	this.$$.connect();
};

exports.create = function(args) {
	return new Socket(args);
};

exports.init = function(c){
	config = _.extend(config, c);
};