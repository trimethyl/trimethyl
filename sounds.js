/**
 * @class  Sounds
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * UI Sounds interface
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.T.sounds);
exports.config = config;


var _players = {};


/**
 * Create the `Ti.Media.Sound` and allocate for future play
 * @param  {String} key The sound file to load
 * @return {Ti.Media.Sound}
 */
function create(key) {
	_players[key] = Ti.Media.createSound({ url: key });
	return _players[key];
}
exports.create = create;


/**
 * Play the sound
 * @param  {String} key The sound file to play
 */
function play(key) {
	if (!(key in _players)) create(key);
	_players[key].play();
}
exports.play = play;


/**
 * Pause the sound
 * @param  {String} key The sound file to pause
 */
function pause(key) {
	if (!(key in _players)) create(key);
	_players[key].pause();
}
exports.pause = pause;