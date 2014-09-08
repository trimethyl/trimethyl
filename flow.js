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

var GA = require('T/ga');

var Navigator = null;
var navPreviousRoute = null;

var _windows = {};
var _windowsId = [];

var _currentControllerName = null;
var _currentController = null;
var _currentControllerArgs = null;


/**
 * Track the time and the screen of this windows with GA
 *
 * @param  {Ti.UI.Window} 	$win 	The window
 * @param  {String} 			key  	The tracking key
 */
function autoTrackWindow($win, key) {
	if (!key) return;

	// Track screen with GA
	if (config.trackWithGA) {
		GA.trackScreen(key);
	}

	// Track timing with GA
	if (config.trackTimingWithGA) {
		if (!$win) return;

		var startFocusTime = null;
		$win.addEventListener('focus', function(){
			startFocusTime = +(new Date());
		});
		$win.addEventListener('blur', function(){
			if (!startFocusTime) return;
			GA.time(key, +(new Date())-startFocusTime);
		});
	}
}
exports.autoTrackWindow = autoTrackWindow;


function onWindowClose(e) {
	delete _windows[e.source._flowid];
	_windowsId = _.without(_windowsId, e.source._flowid);
}

/**
 * Set current Window and push in the windows stack
 * @param {Ti.UI.Window} $win
 */
function setCurrentWindow($win) {
	if (!$win) return;

	var uid = T('util').uniqid();
	Ti.API.debug("Flow: NEW Window - assigned id is "+uid);

	$win._flowid = uid;

	_windows[uid] = $win;
	_windowsId.push(uid);

	$win.addEventListener('close', onWindowClose);
}
exports.setCurrentWindow = setCurrentWindow;

/**
 * Get current Window
 * @return {Ti.UI.Window}
 */
function getCurrentWindow() {
	var id = _.last(_windowsId);
	if (!id) return;
	return _windows[id];
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
 * Set the Navigator used to open the windows
 *
 * ** This is required to do before opening windows **
 *
 * @param {Object} 	nav 			The instance of Ti.UI.iOS.NavigationWindow or compatible
 * @param {Boolean} 	[openNow] 	Specify if call instantly the open on the navigation controller
 */
function setNavigationController(nav, openNow) {
	Ti.API.debug("Flow: NEW Navigator");

	Navigator = nav;
	if (!openNow) return;

	Navigator.open();

	// If is stored navNextRoute object, forward the request to current navigator
	if (null!==navPreviousRoute) {
		var tmp = { "open": open, "openWindow": openWindow };
		tmp[navPreviousRoute.method](navPreviousRoute.arg1, navPreviousRoute.arg2, navPreviousRoute.arg3);
		navPreviousRoute = null;
	}
}
exports.setNavigationController = setNavigationController;

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
	setCurrentWindow(win);
	setCurrentController(controller);
	setNavigationController(nav, true);
}
exports.startup = startup;


/**
 * Open a Window in the current navigation controller.
 *
 * @param  {Ti.UI.Window} $window 	The window object
 * @param  {Object} [opt]        	The arguments passed to the NavigationWindow.openWindow or the Controller.Window.open
 */
function openWindow($win, opt, key) {
	opt = opt || {};

	Ti.API.debug("Flow: opening window");

	if (!Navigator) {
		navPreviousRoute = { method: 'openWindow', arg1: $win, arg2: opt, arg3: null };
		Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
		return;
	}

	if (key) autoTrackWindow($win, key);

	// Open the window
	Navigator.openWindow($win, opt);
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

	Ti.API.debug("Flow: opening DIRECT '"+controller+"' with args "+JSON.stringify(args));

	// Open the controller
	var $ctrl = Alloy.createController(controller, args);
	key = key || $ctrl.analyticsKey || ( controller + (args.id ? '/'+args.id : '') );

	var $win = $ctrl.getView();

	// Attach events
	autoTrackWindow(null, key);

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
	key = key || $ctrl.analyticsKey || ( controller + (args.id ? '/'+args.id : '') );

	var $win = $ctrl.getView();

	if (!Navigator) {
		navPreviousRoute = { method: 'open', arg1: controller, arg2: args, arg3: opt };
		Ti.API.warn("Flow: A NavigationController is not defined yet, waiting for next assignment");
		return;
	}

	// Open the window
	Navigator.openWindow($win, opt.openArgs || {});

	// Attach events
	$win.addEventListener('close', function(){ $ctrl.destroy(); });
	setCurrentWindow($win);
	autoTrackWindow($win, key);

	_currentControllerName = controller;
	_currentControllerArgs = args;
	_currentController = $ctrl;

	return $ctrl;
}
exports.open = open;


/**
 * Close current Navigatgor and all windows associated with it
 */
function close() {
	if (!Navigator) return;

	_windows = {};
	_windowsId = [];
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
		window: getCurrentWindow(),
		controller: _currentController,
		controllerName: _currentControllerName,
		args: _currentControllerArgs,
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
	_currentController = controller;
}
exports.setCurrentController = setCurrentController;

/**
 * Return current controller
 *
 * @return {Alloy.Controller}
 */
function getCurrentController() {
	return _currentController;
}
exports.getCurrentController = getCurrentController;

/**
 * @method controller
 * @inheritDoc #getCurrentController
 * Alias for {@link #getCurrentController}
 */
exports.controller = getCurrentController;

/**
 * Return the windows stacks
 * @return {Object}
 */
function getStack() {
	return {
		order: _windowsId,
		windows: _windows
	};
}
exports.getStack = exports.getStack;
