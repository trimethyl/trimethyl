exports.config = _.extend({
	outputs: ['api']
}, Alloy.CFG.T ? Alloy.CFG.T.logger : {});

var LOGGER_METHODS = ['trace', 'debug', 'warn', 'error', 'info', 'timestamp'];

var outputs_ctrl = [];

function _write() {
	var level = Array.prototype.shift.call(arguments);

	outputs_ctrl.forEach(function(output) {
		try {
			output.write(level, arguments);
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
		Array.prototype.unshift.call(arguments, level);
		_write.apply(null, arguments);
	};
});

// Load all the outputs
exports.config.outputs.forEach(function(output) {
	outputs_ctrl.push(Alloy.Globals.Trimethyl.loadDriver('logger', output, {
		write: function() { throw 'The output ' + output + ' must implement the method write()' }
	}));
});
