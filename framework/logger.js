exports.config = _.extend({
	outputs: ['api']
}, Alloy.CFG.T ? Alloy.CFG.T.logger : {});

var LOGGER_METHODS = ['trace', 'debug', 'warn', 'error', 'info', 'timestamp'];

var outputs_ctrl = [];

function _write(args) {
	// Invoke the write() method for all the outputs
	outputs_ctrl.forEach(function(output) {
		try {
			output.write.apply(null, args);
		} catch(err) {
			Ti.API.warn(err);
		}
	});
}

/**
 * @method loadDriver
 */
exports.loadDriver = function(name) {
	return Alloy.Globals.Trimethyl.loadDriver('logger', name, intf);
};

// Create the interface
LOGGER_METHODS.forEach(function(level) {
	exports[level] = function() {
		var args = Array.prototype.slice.call(arguments);
		Array.prototype.unshift.call(args, level);

		_write(args);
	};
});

// Load all the outputs
exports.config.outputs.forEach(function(output) {
	outputs_ctrl.push(Alloy.Globals.Trimethyl.loadDriver('logger', output, {
		write: function() { throw 'The output ' + output + ' must implement the method write()'; }
	}));
});
