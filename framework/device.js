/**
 * @module  device
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * Get the device screen density
 * @return {Number} The density
 */
exports.getScreenDensity = function() {
	return Alloy.Globals.SCREEN_DENSITY;
};

/**
 * Get the device screen width
 * @return {Number} The width
 */
exports.getScreenWidth = function() {
	// Don't return the constant because of orientationchange
	return OS_IOS ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
};

/**
 * Get the device screen width
 * @return {Number} The height
 */
exports.getScreenHeight = function() {
	// Don't return the constant because of orientationchange
	return OS_IOS ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;
};

/**
 * Check if current device is a Simulator
 * @return {Boolean}
 */
exports.isSimulator = function() {
	return Alloy.Globals.IS_SIMULATOR;
};

/**
 * @return {Boolean}
 */
exports.isIPhone = function() {
	return Ti.Platform.osname === 'iphone';
};

/**
 * @return {Boolean}
 */
exports.isIPad = function() {
	return Ti.Platform.osname === 'ipad';
};

/**
 * @return {Object}
 */
exports.getInfo = function() {
	return _.pick(Ti.Platform, 'architecture', 'batteryLevel', 'locale', 'manufacturer', 'model', 'osname', 'runtime', 'username', 'version');
};
