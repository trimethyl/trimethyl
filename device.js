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
	if (OS_ANDROID) return Ti.Platform.displayCaps.logicalDensityFactor;
	return Titanium.Platform.displayCaps.dpi/160;
};

/**
 * @method getScreenWidth
 * Get the device screen width
 * @return {Number} The width
 */
exports.getScreenWidth = function() {
	if (OS_IOS) return Ti.Platform.displayCaps.platformWidth;
	return Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
};

/**
 * @method getScreenHeight
 * Get the device screen width
 * @return {Number} The height
 */
exports.getScreenHeight = function() {
	if (OS_IOS) return Ti.Platform.displayCaps.platformHeight;
	return Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;
};

/**
 * @method isSimulator
 * Check if current device is a Simulator
 * @return {Boolean}
 */
exports.isSimulator = function() {
	return Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1;
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
