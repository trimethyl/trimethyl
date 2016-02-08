
var logLevels = ['info', 'error', 'debug', 'trace', 'warn'];

function _parse(args) {
	var parse_values = args;

	Array.prototype.forEach.call(parse_values, function(args, i, messages) {
		if (typeof args === 'object') {
			messages[i] = JSON.stringify(args, function(key, val) {
				if (typeof val !== 'object') {
					return val;
				}
				try {
					JSON.stringify(val);
					return val;
				} catch (err) {
					return undefined;
				}
			}, 4);
		}
	});

	return parse_values;
}

exports.write = function() {
	var level = Array.prototype.shift.call(arguments);

	// Fallback to info level
	if (logLevels.indexOf(level) === -1) level = 'info';

	Ti.API[level](Array.prototype.join.call(_parse(arguments), ' '));
};