require('ti-mocha');
require('T/trimethyl');

describe('Trimethyl', function() {

	///////////
	// HTTP //
	///////////
	describe('HTTP', function() {
		var HTTP = require('T/http');

		it('handle requests and parse response headers', function(done) {
			HTTP.send({
				url: 'http://graph.facebook.com/4',
				errorAlert: false,
				success: function(response) {
					if (response == null) throw 'response is null';
					if (!_.isObject(response)) throw 'response is not an object';
					if (response.username !== 'zuck') throw 'Mark is not Mark';

					done();
				},
				error: function() {
					throw 'error callback is executed';
				}
			});
		});

		it('handle HTTP errors', function(done) {
			HTTP.send({
				url: 'http://graph.facebook.com/3',
				errorAlert: false,
				success: function(response) {
					throw 'success callback is called';
				},
				error: function(err) {
					if (!_.isObject(err)) throw 'error object is not an object';
					if (err.code !== 400) throw 'error code is not handled correctly';

					done();
				}
			});
		});

	});

});

// run the tests
mocha.run();