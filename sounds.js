/**
 * @class  	Sounds
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


var players = {};

/**
 * @method create
 * Create the `Ti.Media.Sound` and allocate for future play
 * @param  {String} key The sound file to load
 * @return {Ti.Media.Sound}
 */
exports.create = function(key) {
	players[key] = Ti.Media.createSound({ url: key });
	return players[key];
};

/**
 * @method play
 * Play the sound
 * @param  {String} key The sound file to play
 */
exports.play = function(key) {
	if (players[key] == null) exports.create(key);
	players[key].play();
};

/**
 * @method pause
 * Pause the sound
 * @param  {String} key The sound file to pause
 */
exports.pause = function(key) {
	if (players[key] == null) exports.create(key);
	players[key].pause();
};
