/**
 * @class  Device
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Query current device for informations
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.device);
exports.config = config;


/**
 * Subscribe for accellerometer updates
 *
 * @param  {Function} callback The callback
 */
function onTilt(callback) {
	if (Alloy.Globals.SIMULATOR){
		Ti.API.error('Device: accelerometer doesn\'t work on virtual devices');
		return;
	}

	Ti.Accelerometer.addEventListener('update', callback);

	if (OS_ANDROID){
		// remove listeners on android to preserve battery life

		Ti.Android.currentActivity.addEventListener('pause', function() {
			Ti.Accelerometer.removeEventListener('update', callback);
		});

		Ti.Android.currentActivity.addEventListener('resume', function() {
			Ti.Accelerometer.addEventListener('update', callback);
		});
	}
}
exports.onTilt = onTilt;


/**
 * Unsubscribe for accellerometer updates
 *
 * @param  {Function} callback The previous callback installed
 */
function offTilt(callback) {
	Ti.Accelerometer.removeEventListener('update', callback);
}
exports.offTilt = offTilt;


/**
 * Get the device screen density
 *
 * @return {Number} The density
 */
function getScreenDensity() {
	if (OS_ANDROID) return Ti.Platform.displayCaps.logicalDensityFactor;
	return Titanium.Platform.displayCaps.dpi/160;
}
exports.getScreenDensity = getScreenDensity;


/**
 * Get the device screen width
 *
 * @return {Number} The width
 */
function getScreenWidth(){
	if (OS_IOS) return Ti.Platform.displayCaps.platformWidth;
	return Ti.Platform.displayCaps.platformWidth/Ti.Platform.displayCaps.logicalDensityFactor;
}
exports.getScreenWidth = getScreenWidth;


/**
 * Get the device screen width
 *
 * @return {Number} The height
 */
function getScreenHeight(){
	if (OS_IOS) return Ti.Platform.displayCaps.platformHeight;
	return Ti.Platform.displayCaps.platformHeight/Ti.Platform.displayCaps.logicalDensityFactor;
}
exports.getScreenHeight = getScreenHeight;
