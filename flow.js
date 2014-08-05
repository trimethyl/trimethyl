/**
 * @class  Flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Manage the app windows flow, tracking optionally with Google Analitycs
 */

/**
 * * **trackWithGA**: Send the trackScreen directly to GA module. Default: `true`
 * * **trackTimingWithGA**: Track the timing of focus/blur of the window. Default: `true`
 * @type {Object}
 */
var config = _.extend({
	trackWithGA: true,
	trackTimingWithGA: true
}, Alloy.CFG.T.flow);
exports.config = config;


var Navigator = null;
var navPreviousRoute = null;

var $_cur_CTRL_AS_STR = null;
var $_cur_CTRL = null;
var $_cur_CTRL_ARGS = null;
var $_cur_WIN = null;


/**
 * Set the Navigator used to open the windows
 *
 * ** This is required to do before opening windows **
 *
 * @param {Object} 	nav 			The instance of Ti.UI.iOS.NavigationWindow or compatible
 * @param {Boolean} 	[openNow] 	Specify if call instantly the open on the navigation controller
 */
function setNavigationController(nav, openNow) {
	Navigator = nav;

	if (openNow) {
		Navigator.open();

		// If is stored navNextRoute object, forward the request to current navigator
		if (null!==navPreviousRoute) {
			var tmp = { "open": open, "openWindow": openWindow };
			tmp[navPreviousRoute.method](navPreviousRoute.arg1, navPreviousRoute.arg2, navPreviousRoute.arg3);
			navPreviousRoute = null;
		}

	}
}
exports.setNavigationController = setNavigationController;


/**
 * Set, in a single way, the global Navigator (and open it), the Index-Controller and the Index-Window
 *
 * This method, is typically called on startup, on the index.js, like this:
 *
 * ```
 * T('flow').startup($, $.nav, $.win);
 * ```
 *
 * @param  {Alloy.Controller} 		controller
 * @param  {Object} 						nav
 * @param  {Ti.UI.Window} 				win
 */
function startup(controller, nav, win) {
	setNavigationController(nav, true);
	setCurrentController(controller);
	setCurrentWindow(win);
}
exports.startup = startup;


/**
 * Open a Window in the current navigation controller.
 *
 * @param  {Ti.UI.Window} $window 	The window object
 * @param  {Object} [opt]        	The arguments passed to the NavigationWindow.openWindow or the Controller.Window.open
 */
function openWindow($window, opt) {
	opt = opt || {};

	if (!Navigator) {
		navPreviousRoute = { method: 'openWindow', arg1: $window, arg2: opt, arg3: null };
		Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
		return;
	}

	// Open the window
	Navigator.openWindow($window, opt);
}
exports.openWindow = openWindow;


/**
 * Require an Alloy.Controller without passing it to the Navigator
 *
 * This is anyway tracked with Google Analitycs
 *
 * @param  {String} controller 	The name of the controller
 * @param  {Object} [args]     	The args passed to the controller
 * @param  {Object} [opt]        Additional arguments
 * @param  {String} [key]			Optional key that identify this controller
 */
function openDirect(controller, args, opt, key) {
	args = args || {};
	opt = opt || {};

	Ti.API.debug("Flow: opening directly '"+controller+"' with args "+JSON.stringify(args));

	// Open the controller
	var $ctrl = Alloy.createController(controller, args || {});
	key = key || $ctrl.analyticsKey || controller;

	var $win = $ctrl.getView();

	// Track with Google Analitycs
	if ($win) autoTrackWindow($win, key);

	return $ctrl;
}
exports.openDirect = openDirect;


/**
 * Require an Alloy.Controller and open its main `Window` in the Navigator.
 *
 * A `close` event is automatically attached to the main window to call sequentially
 * `Controller.beforeDestroy` (if defined) and `Controller.destroy`
 *
 * This is tracked with Google Analitycs
 *
 * @param  {String} controller The name of the controller
 * @param  {Object} [args]       The arguments passed to the controller
 * @param  {Object} [opt]        Additional arguments:
 * * `openArgs` The arguments passed to the Window.open
 * @param  {String} [key]			Optional key that identify this controller
 * @return {Alloy.Controller}    The controller instance
 */
function open(controller, args, opt, key) {
	args = args || {};
	opt = opt || {};

	Ti.API.debug("Flow: opening '"+controller+"' with args "+JSON.stringify(args));

	var $ctrl = Alloy.createController(controller, args);
	key = key || $ctrl.analyticsKey || controller;

	var $win = $ctrl.getView();

	if (!Navigator) {
		navPreviousRoute = { method: 'open', arg1: controller, arg2: args, arg3: opt };
		Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
		return;
	}

	// Open the window
	Navigator.openWindow($win, opt.openArgs || {});

	// Attach events
	$win.addEventListener('close', function(){
		if ('beforeDestroy' in $ctrl) $ctrl.beforeDestroy();
		$ctrl.destroy();
	});

	// Track with Google Analitycs
	autoTrackWindow($win, key);

	$_cur_CTRL_AS_STR = controller;
	$_cur_CTRL_ARGS = args;
	$_cur_CTRL = $ctrl;
	$_cur_WIN = $win;

	return $ctrl;
}
exports.open = open;


/**
 * Close current Navigatgor and all windows associated with it
 */
function close() {
	if (!Navigator) return;
	Navigator.close();
}
exports.close = close;


/**
 * Get an object with currents UI.
 *
 * @return {Object} [description]
 */
function getCurrent() {
	return {
		navigator: Navigator,
		controller: $_cur_CTRL,
		window: $_cur_WIN,
		args: $_cur_CTRL_ARGS,
	};
}
exports.getCurrent = getCurrent;

/**
 * @method current
 * @inheritDoc #getCurrent
 * Alias for {@link #getCurrent}
 */
exports.current = getCurrent;

/**
 * Set current controller
 *
 * @param {Alloy.Controller} controller
 */
function setCurrentController(controller) {
	$_cur_CTRL = controller;
	$_cur_WIN = controller.getView();
}
exports.setCurrentController = setCurrentController;

/**
 * Return current controller
 *
 * @return {Alloy.Controller}
 */
function getCurrentController() {
	return $_cur_CTRL;
}
exports.getCurrentController = getCurrentController;

/**
 * @method controller
 * @inheritDoc #getCurrentController
 * Alias for {@link #getCurrentController}
 */
exports.controller = getCurrentController;

/**
 * Set current Window
 * @param {Ti.UI.Window} $window
 */
function setCurrentWindow($window) {
	$_cur_WIN = $window;
}
exports.setCurrentWindow = setCurrentWindow;


/**
 * Get current Window
 * @return {Ti.UI.Window}
 */
function getCurrentWindow() {
	return $_cur_WIN;
}
exports.getCurrentWindow = getCurrentWindow;

/**
 * @method window
 * @inheritDoc #getCurrentWindow
 * Alias for {@link #getCurrentWindow}
 */
exports.window = getCurrentWindow;
/**
 * @method win
 * @inheritDoc #getCurrentWindow
 * Alias for {@link #getCurrentWindow}
 */
exports.win = getCurrentWindow;


/**
 * Return the instance set of navigation controller
 *
 * @return {Object} The navigation controller
 */
function getNavigationController() {
	return Navigator;
}
exports.getNavigationController = getNavigationController;

/**
 * @method navigator
 * @inheritDoc #getNavigationController
 * Alias for {@link #getNavigationController}
 */
exports.navigator = getNavigationController;
/**
 * @method nav
 * @inheritDoc #getNavigationController
 * Alias for {@link #getNavigationController}
 */
exports.nav = getNavigationController;


function autoTrackWindow(window, key) {
	if (config.trackWithGA) {
		require('T/ga').trackScreen(key);
	}

	if (config.trackTimingWithGA) {
		var startFocusTime = null;
		window.addEventListener('focus', function(){
			startFocusTime = +(new Date());
		});
		window.addEventListener('blur', function(){
			if (startFocusTime) require('T/ga').time(key, +(new Date())-startFocusTime);
		});
	}
}
exports.autoTrackWindow = autoTrackWindow;