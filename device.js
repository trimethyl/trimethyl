/**
 * @class  	Device
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @method getScreenDensity
 * Get the device screen density
 * @return {Number} The density
 */
exports.getScreenDensity = function() {
	return Alloy.Globals.SCREEN_DENSITY;
};

/**
 * @method getScreenWidth
 * Get the device screen width
 * @return {Number} The width
 */
exports.getScreenWidth = function() {
	return Alloy.Globals.SCREEN_WIDTH;
}

/**
 * @method getScreenHeight
 * Get the device screen width
 * @return {Number} The height
 */
exports.getScreenHeight = function() {
	return Alloy.Globals.SCREEN_HEIGHT;
};

/**
 * @method isSimulator
 * Check if current device is a Simulator
 * @return {Boolean}
 */
exports.isSimulator = function() {
	return Alloy.Globals.IS_SIMULATOR;
};

/**
 * @method isIPhone
 * @return {Boolean}
 */
exports.isIPhone = function() {
	return Ti.Platform.osname === 'iphone';
};

/**
 * @method isIPad
 * @return {Boolean}
 */
exports.isIPad = function() {
	return Ti.Platform.osname === 'ipad';
};

/**
 * @method getInfo
 * @return {Object}
 */
exports.getInfo = function() {
	return _.pick(Ti.Platform, 'architecture', 'batteryLevel', 'locale', 'manufacturer', 'model', 'osname', 'runtime', 'username', 'version');
};
