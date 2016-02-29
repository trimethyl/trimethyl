/**
 * @class  	Logger.Telegram
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

/**
 * @property config
 * @property {String} [config.token=null]					The authorization token for a Telegram bot
 * @property {String} [config.chatId=null]					Unique identifier for the target chat or username of the target channel (in the format @channelusername)
 * @property {String} [config.parseMode='Markdown']			Use the keywords 'Markdown' or 'HTML', if you want Telegram apps to show bold, italic, fixed-width text or inline URLs in your bot's message. Otherwise, set to null.
 * @property {String} [config.disableNotification=false]	Sends the message silently. iOS users will not receive a notification, Android users will receive a notification with no sound.
 */
exports.config = _.defaults((Alloy.CFG.T && Alloy.CFG.T.logger) ? Alloy.CFG.T.logger.telegram : {}, {
	token: null,
	chatId: null,
	parseMode: 'Markdown',
	disableNotification: false
});

var HTTP = require('T/http');
var API_URL = 'https://api.telegram.org/bot%s/';
var CLASS_NAME = 'Logger/Telegram:';

var PARSERS = {
	Markdown: function(arg) {
		if (typeof arg === 'object') {
			return '```' + arg + '```';
		}

		return arg;
	},

	HTTP: function(arg) {
		Ti.API.warn(CLASS_NAME + ' HTML parsing not yet implemented');

		return arg;
	}
}

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

		if (exports.config.parseMode != null) {
			messages[i] = PARSERS[exports.config.parseMode](messages[i])
		}
	});

	return parse_values;
}

/**
 * @method write
 * @param {String} level A severity level.
 * @param message The message's parts
 */
exports.write = function() {
	var level = Array.prototype.shift.call(arguments);

	var parsed_text = Array.prototype.join.call(_parse(arguments), ' ');

	// Write to the Telegram bot
	HTTP.send({
		url: String.format(API_URL, exports.config.token) + 'sendMessage',
		data: {
			chat_id: exports.config.chatId,
			text: '\\[' + level.toUpperCase() + '] ' + parsed_text,
			parse_mode: exports.config.parseMode,
			disable_notification: exports.config.disableNotification
		},
		format: 'json',
		success: function(response) {
			if (response.ok === true) {
				Ti.API.info(CLASS_NAME + ' message successfully sent to ' + exports.config.chatId);
			} else {
				Ti.API.error(CLASS_NAME + ' message send failed:', response)
			}
		},
		error: function (err) {
			Ti.API.error(CLASS_NAME + ' error while sending message to bot:', err);
		}
	});
};