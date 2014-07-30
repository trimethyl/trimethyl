/**
 * @class  Flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Manage the app windows flow, tracking optionally with Google Analitycs
 */

/**
 * * **useNav**: Use a Navigation Controller instead opening windows directly. Default: `true`
 * * **trackWithGA**: Send the trackScreen directly to GA module. Default: `true`
 * * **trackTimingWithGA**: Track the timing of focus/blur of the window. Default: `true`
 * @type {Object}
 */
var config = _.extend({
	useNav: true,
	trackWithGA: true,
	trackTimingWithGA: true
}, Alloy.CFG.T.flow);
exports.config = config;

var $_cur_CTRL_AS_STR = null;
var $_cur_CTRL = null;
var $_cur_CTRL_ARGS = null;
var $_cur_WIN = null;

var hist = [];

var navNR = null;
var $nav = null;

/**
 * Set the navigation controller used to open windows
 *
 * @param {Ti.UI.iOS.NavigationWindow} nav The instance of the navigation controller
 * @param {Boolean} [openNow] Specify if call instantly the open on the navigation controller
 */
function setNavigationController(nav, openNow) {
	$nav = nav;

	if (openNow) {
		$nav.open();

		// If is stored navNextRoute object, forward the request to current navigator
		if (navNR) {
			var tmp = { "open": open, "openWindow": openWindow };
			tmp[navNR.method](navNR.arg1, navNR.arg2, navNR.arg3);
			navNR = null;
		}

	}
}
exports.setNavigationController = setNavigationController;


/**
 * Set, in a single way, the global NavigationWindow (and open it), the Index Controller and the Index Window
 *
 * This method, is typically called on startup, on the index.js, like this:
 *
 * ```
 * T('flow').startup($, $.nav, $.win);
 * ```
 *
 * @param  {Alloy.Controller} 		controller
 * @param  {Ti.UI.NavigationWindow} nav
 * @param  {Ti.UI.Window} 				win
 */
function startup(controller, nav, win) {
	setNavigationController(nav, true);
	setCurrentController(controller);
	setCurrentWindow(win);
}
exports.startup = startup;



/**
 * Close an Alloy.Controller
 *
 * If a `close` function is attached to controller exports, call that
 *
 * Otherwise simply close the main window
 *
 * @param  {Alloy.Controller} controller The controller to close
 */
function closeController(controller) {
	if (!controller) return;

	if ('close' in controller) {
		controller.close();
	} else {
		controller.getView().close();
	}
}
exports.closeController = closeController;


/**
 * Open a Window in current flow.
 *
 * If a navigation controller is set, open with it.
 *
 * @param  {Ti.UI.Window} $window 	The window object
 * @param  {Object} [opt]        	The arguments passed to the NavigationWindow.openWindow or the Controller.Window.open
 */
function openWindow($window, opt) {
	opt = opt || {};

	if (config.useNav) {

		if (!$nav) {
			navNR = { method: 'openWindow', arg1: $window, arg2: opt, arg3: null };
			Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
			return;
		}

		// Open the window
		$nav.openWindow($window, opt);

	} else {
		$window.open(opt || {});
	}
}
exports.openWindow = openWindow;


/**
 * Require an Alloy.Controller without passing it to the navigation window
 *
 * This is tracked with Google Analitycs
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

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('T/ga').trackScreen(key);
	}

	return $ctrl;
}
exports.openDirect = openDirect;


/**
 * Require an Alloy.Controller and open the main window associated with it
 *
 * If a navigation controller is set, open with it
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

	if (config.useNav) {

		if (!$nav) {
			navNR = { method: 'open', arg1: controller, arg2: args, arg3: opt };
			Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
			return;
		}

		// Open the window
		$nav.openWindow($win, opt.openArgs || {});

	} else {
		$win.open(opt.openArgs || {});
	}

	// Attach events
	$win.addEventListener('close', function(){
		if ('beforeDestroy' in $ctrl) $ctrl.beforeDestroy();
		$ctrl.destroy();
		$ctrl = null;
		$win = null;
	});

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('T/ga').trackScreen(key);


		// Track time with GA
		if (config.trackTimingWithGA) {

			var startFocusTime = null;
			$win.addEventListener('focus', function(){
				startFocusTime = +(new Date());
			});

			$win.addEventListener('blur', function(){
				if (startFocusTime) require('T/ga').time(key, +(new Date())-startFocusTime);
			});

		}

	}

	// Put in the history current controller an its args
	hist.push({
		controller: controller,
		args: args
	});

	// Close current controller if not using NavigationWindow based stack
	if (!config.useNav && !opt.singleTask && $_cur_CTRL) {
		closeController($_cur_CTRL);
	}

	$_cur_CTRL_AS_STR = controller;

	$_cur_CTRL_ARGS = args;
	$_cur_CTRL = $ctrl;
	$_cur_WIN = $win;

	return $ctrl;
}
exports.open = open;


/**
 * Close current controller and go back the the previous controller
 */
function back() {
	if (hist.length<2) return;
	closeCurrent();
	var last = hist.pop();
	open(last.controller, last.args);
}
exports.back = back;


/**
 * Get an object with currents controller, args and window
 *
 * @return {Object} [description]
 */
function getCurrent() {
	return {
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
 * Return current controller
 *
 * @return {Alloy.Controller}
 */
function getCurrentController() {
	return $_cur_CTRL;
}
exports.getCurrentController = getCurrentController;

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
 * @method controller
 * @inheritDoc #getCurrentController
 * Alias for {@link #getCurrentController}
 */
exports.controller = getCurrentController;

/**
 * Close current controller
 */
function closeCurrent() {
	hist.pop();
	closeController($_cur_CTRL);
}
exports.closeCurrent = closeCurrent;

/**
 * Get the history of controllers used
 *
 * @return {Array}
 */
function getHistory() {
	return hist;
}
exports.getHistory = getHistory;

/**
 * Clear the history of controllers used
 */
function clearHistory(){
	hist = [];
}
exports.clearHistory = clearHistory;

/**
 * Get current Window
 * @return {Ti.UI.Window}
 */
function getCurrentWindow() {
	return $_cur_WIN;
}
exports.getCurrentWindow = getCurrentWindow;

/**
 * Set current Window
 * @param {Ti.UI.Window} $window
 */
function setCurrentWindow($window) {
	$_cur_WIN = $window;
}
exports.setCurrentWindow = setCurrentWindow;

/**
 * @method window
 * @inheritDoc #getCurrentWindow
 * Alias for {@link #getCurrentController}
 */
exports.window = getCurrentWindow;


/**
 * Return the instance set of navigation controller
 *
 * @return {Ti.UI.NavigationWindow} The navigation controller
 */
function getNavigationController() {
	return $nav;
}
exports.getNavigationController = getNavigationController;


/**
 * @method nav
 * @inheritDoc #getNavigationController
 * Alias for {@link #getNavigationController}
 */
exports.nav = getNavigationController();
