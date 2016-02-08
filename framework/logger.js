/**
 * @class  	Logger
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

/**
 * @property config
 * @property {Array} [config.outputs=["api"]] The output methods to use
 */
exports.config = _.extend({
	outputs: ['api']
}, Alloy.CFG.T ? Alloy.CFG.T.logger : {});

var LOGGER_METHODS = ['trace', 'debug', 'warn', 'error', 'info'];

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

/**
 * @method trace Logs messages with a trace severity-level.
 * @param arguments
 */
/**
 * @method info Logs messages with an info severity-level.
 * @param arguments
 */
/**
 * @method debug Logs messages with a debug severity-level.
 * @param arguments
 */
/**
 * @method warn Logs messages with a warn severity-level.
 * @param arguments
 */
/**
 * @method error Logs messages with an error severity-level.
 * @param arguments
 */
LOGGER_METHODS.forEach(function(level) {
	// Create the interface
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
