/**
 * @class  	UIFactory
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @method  createNavigationWindow
 */
exports.createNavigationWindow = function(args) {
	if (OS_IOS && args._useFallback != true) {
		return Ti.UI.iOS.createNavigationWindow(args);
	} else {
		return new (require('T/uifactory/navigationwindow'))(args);
	}
};

/**
 * @method createWindow
 */
exports.createWindow = function(args) {
	return require('T/uifactory/window')(args);
};

/**
 * @method createTextField
 */
exports.createTextField = function(args) {
	return require('T/uifactory/textfield')(args);
};

/**
 * @method createTextArea
 */
exports.createTextArea = function(args) {
	return require('T/uifactory/textarea')(args);
};

/**
 * @method createLabel
 */
exports.createLabel = function(args) {
	return require('T/uifactory/label')(args);
};

/**
 * @method createListView
 */
exports.createListView = function(args) {
	return require('T/uifactory/listview')(args);
};

/**
 * @method createTabbedBar
 */
exports.createTabbedBar = function(args) {
	args = args || {};
	if (OS_IOS && args._useFallback != true) {
		return Ti.UI.iOS.createTabbedBar(args);
	} else {
		return require('T/uifactory/tabbedbar')(args);
	}
};

/**
 * @method createYoutubeVideoWebView
 */
exports.createYoutubeVideoWebView = function(args) {
	return require('T/uifactory/youtubevideowebview')(args);
};

/**
 * @method createSelect
 */
exports.createSelect = function(args) {
	return require('T/uifactory/select')(args);
};

/**
 * @method createView
 */
exports.createView = function(args) {
	return require('T/uifactory/view')(args);
};

/**
 * @method createButton
 */
exports.createButton = function(args) {
	return require('T/uifactory/button')(args);
};

/**
 * @method createImageView
 */
exports.createImageView = function(args) {
	return require('T/uifactory/imageview')(args);
};

/**
 * @method createImageView
 */
exports.createImageLoadingView = function(args) {
	return require('T/uifactory/imageloadingview')(args);
};
