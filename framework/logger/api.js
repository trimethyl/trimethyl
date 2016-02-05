
var logLevels = ['info', 'error', 'debug', 'trace', 'warn'];

function _parse(args) {
	var parse_values = args;

	Array.prototype.forEach.call(parse_values, function(msg, i, messages) {
		if (typeof msg === 'object') {
			messages[i] = JSON.stringify(msg, function(key, val) {
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

exports.write = function(level, args) {
	// Fallback to info level
	if (logLevels.indexOf(level) === -1) level = 'info';

	Ti.API[level](_parse(args));
};