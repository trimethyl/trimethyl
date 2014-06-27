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


var Players = {};


/**
 * Create the `Ti.Media.Sound` and allocate for future play
 * @param  {String} key The sound file to load
 * @return {Ti.Media.Sound}
 */
function create(key) {
	Players[key] = Ti.Media.createSound({ url: key });
	return Players[key];
}
exports.create = create;


/**
 * Play the sound
 * @param  {String} key The sound file to play
 */
function play(key) {
	if (!(key in Players)) {
		create(key);
	}

	Players[key].play();
}
exports.play = play;


/**
 * Pause the sound
 * @param  {String} key The sound file to pause
 */
function pause(key) {
	if (!(key in Players)) {
		create(key);
	}

	Players[key].pause();
}
exports.pause = pause;