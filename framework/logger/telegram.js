/**
 * @class  	Logger.Telegram
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

exports.config = _.defaults((Alloy.CFG.T && Alloy.CFG.T.logger) ? Alloy.CFG.T.logger.telegram : {}, {
	token: null,
	useMarkdown: true
});

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

function toMarkdown(arg) {
	if (typeof arg === 'object') {
		return '```' + arg + '```';
	}

	return arg;
}


/**
 * @method write
 * @param {String} level A severity level.
 * @param message The message's parts
 */
exports.write = function() {
	var level = Array.prototype.shift.call(arguments);

	// Write to Telegram
	Ti.API.warn('Not yet implemented');
};