/**
 * @class  	UIFactory
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide XP UI elements to handle differences between platforms
 *
 * Inspired to FokkeZB UTIL, thanks!
 *
 * You can use in Alloy XML Views with `module="T/uifactory"` syntax.
 *
 * All new methods can be called automatically on UI-creation with its relative property.
 *
 * For example, if a module expose the method `setFooProperty`,
 * you can assign on creation using:
 *
 * ```
 * var me = T('uifactory').createBar({ fooProperty: 'a' })
 * ```
 *
 * **DON'T** use the `me.fooProperty = [NEW VALUE]` syntax to assign the property,
 * use `setFooProperty` instead.
 *
 * **DON'T** use the `me.fooProperty` syntax to get the value,
 * use `getFooProperty` instead.
 *
 */


/**
 * @method  createNavigationWindow
 */
exports.createNavigationWindow = function(args) {
	args = args || {};
	if (OS_IOS) return Ti.UI.iOS.createNavigationWindow(args);
	return new require('T/uifactory/navigationwindow')(args);
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
	if (OS_IOS) return Ti.UI.createTabbedBar(args);
	return require('T/uifactory/tabbedbar')(args);
};


/**
 * @method createYoutubeVideoWebView
 */
exports.createYoutubeVideoWebView = require('T/uifactory/youtubevideowebview');

/**
 * @method createPicker
 */
exports.createPicker = require('T/uifactory/picker');