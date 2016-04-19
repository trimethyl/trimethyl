/**
 * @module  logger
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

/**
 * @property config
 * @property {Array} [config.outputs=["api"]] The output methods to use
 */
exports.config = _.extend({
	outputs: ['api']
}, Alloy.CFG.T ? Alloy.CFG.T.logger : {});

var CLASS_NAME = 'Logger:';
var LOGGER_METHODS = ['trace', 'debug', 'warn', 'error', 'info'];

function _write() {
	var args = arguments;
	// Invoke the write() method for all the outputs
	exports.config.outputs.forEach(function(output) {
		try {
			exports[toUpperCamelCase(output)].write.apply(null, args);
		} catch(err) {
			Ti.API.warn(CLASS_NAME, err);
		}
	});
}

function toUpperCamelCase(str) {
	return str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase().replace(/_([a-z])/g, function() {
		return arguments[1].toUpperCase();
	});
}

/**
 * Load a driver of current module
 */
exports.loadDriver = function(name) {
	return Alloy.Globals.Trimethyl.loadDriver('logger', name, intf);
};

LOGGER_METHODS.forEach(function(level) {
	// Create the interface
	exports[level] = function() {
		//var args = Array.prototype.slice.call(arguments);
		Array.prototype.unshift.call(arguments, level);

		_write.apply(null, arguments);
	};
});

// Load all the outputs
exports.config.outputs.forEach(function(output) {
	exports[toUpperCamelCase(output)] = Alloy.Globals.Trimethyl.loadDriver('logger', output, {
		write: function() { throw 'The output ' + output + ' must implement the method write()'; }
	});
});
