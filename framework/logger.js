exports.config = _.extend({
	outputs: ['api']
}, Alloy.CFG.T ? Alloy.CFG.T.logger : {});

var LOGGER_METHODS = ['trace', 'debug', 'warn', 'error', 'info', 'timestamp'];

var strategies_ctrl = [];

function _write() {
	var level = Array.prototype.shift.call(arguments);

	strategies_ctrl.forEach(function(strategy) {
		try {
			strategy.write(level, arguments);
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

// Load all the strategies
exports.config.strategies.forEach(function(strategy) {
	strategies_ctrl.push(Alloy.Globals.Trimethyl.loadDriver('logger', name, {
		write: function() { throw 'The strategy ' + name + ' must implement the method write()' }
	}));
});
