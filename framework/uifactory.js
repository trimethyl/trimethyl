/**
 * @module  uifactory
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 */
exports.createNavigationWindow = function(args) {
	if (OS_IOS && args._useFallback != true) {
		return Ti.UI.iOS.createNavigationWindow(args);
	} else {
		return new (require('T/uifactory/navigationwindow'))(args);
	}
};

/**
 */
exports.createWindow = function(args) {
	return require('T/uifactory/window')(args);
};

/**
 */
exports.createTextField = function(args) {
	return require('T/uifactory/textfield')(args);
};

/**
 */
exports.createTextArea = function(args) {
	return require('T/uifactory/textarea')(args);
};

/**
 */
exports.createLabel = function(args) {
	return require('T/uifactory/label')(args);
};

/**
 */
exports.createListView = function(args) {
	return require('T/uifactory/listview')(args);
};

/**
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
 */
exports.createYoutubeVideoWebView = function(args) {
	return require('T/uifactory/youtubevideowebview')(args);
};

/**
 */
exports.createSelect = function(args) {
	return require('T/uifactory/select')(args);
};

/**
 */
exports.createMultiSelect = function(args) {
	return require('T/uifactory/multiselect')(args);
};

/**
 */
exports.createDateSelect = function(args) {
	return require('T/uifactory/dateselect')(args);
};

/**
 */
exports.createTimeSelect = function(args) {
	return require('T/uifactory/timeselect')(args);
};

/**
 */
exports.createView = function(args) {
	return require('T/uifactory/view')(args);
};

/**
 */
exports.createButton = function(args) {
	return require('T/uifactory/button')(args);
};

/**
 */
exports.createImageView = function(args) {
	return require('T/uifactory/imageview')(args);
};

/**
 */
exports.createImageLoadingView = function(args) {
	return require('T/uifactory/imageloadingview')(args);
};

/**
 */
exports.createZoomImageView = function(args) {
	return require('T/uifactory/zoomimageview')(args);
};

/**
 */
exports.createBackgroundView = function(args) {
	return require('T/uifactory/backgroundview')(args);
};

/**
 */
exports.createActionButton = function(args) {
	return require('T/uifactory/actionbutton')(args);
};
