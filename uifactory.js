/**
 * @class  	UIFactory
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @method  createNavigationWindow
 */
exports.createNavigationWindow = function(args) {
	args = args || {};
	if (OS_IOS && args._useFallback != true) {
		return Ti.UI.iOS.createNavigationWindow(args);
	} else {
		var NavigationWindow = require('T/uifactory/navigationwindow');
		return new NavigationWindow(args);
	}
};

/**
 * @method createWindow
 */
exports.createWindow = require('T/uifactory/window');

/**
 * @method createTextField
 */
exports.createTextField = require('T/uifactory/textfield');

/**
 * @method createTextArea
 */
exports.createTextArea = require('T/uifactory/textarea');

/**
 * @method createLabel
 */
exports.createLabel = require('T/uifactory/label');

/**
 * @method createListView
 */
exports.createListView = require('T/uifactory/listview');

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
exports.createYoutubeVideoWebView = require('T/uifactory/youtubevideowebview');

/**
 * @method createSelect
 */
exports.createSelect = require('T/uifactory/select');

/**
 * @method createView
 */
exports.createView = require('T/uifactory/view');

/**
 * @method createButton
 */
exports.createButton = require('T/uifactory/button');
