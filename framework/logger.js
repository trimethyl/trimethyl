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

function _write(args) {
	// Invoke the write() method for all the outputs
	exports.config.outputs.forEach(function(output) {
		try {
			exports[toUpperCamelCase(output)].write.apply(null, args);
		} catch(err) {
			Ti.API.warn(err);
		}
	});
}

function toUpperCamelCase(str) {
	return str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase().replace(/_([a-z])/g, function() {
		return arguments[1].toUpperCase();
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
	exports[toUpperCamelCase(output)] = Alloy.Globals.Trimethyl.loadDriver('logger', output, {
		write: function() { throw 'The output ' + output + ' must implement the method write()'; }
	});
});
