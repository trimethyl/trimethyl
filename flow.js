/**
 * @class  Flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Manage the app windows flow, tracking optionally with Google Analytics.
 */

/**
 * * `trackWithGA` Send the trackScreen directly to GA module. Default: `true`
 * * `trackTimingWithGA` Track the timing of focus/blur of the window. Default: `true`
 * @type {Object}
 */
var config = _.extend({
	trackWithGA: true,
	trackTimingWithGA: true
}, Alloy.CFG.T.flow);
exports.config = config;

var GA = require('T/ga');

var Navigator = null; // represents current navigator
var navPreviousRoute = null; // route to handle on startup

var windows = {}; // all windows objects
var windowsId = []; // all windows id

var currentControllerName = null;
var currentController = null;
var currentControllerArgs = null;


/**
 * Track the time and the screen of this windows with GA
 *
 * @param  {Ti.UI.Window} 	$win 	The window
 * @param  {String} 			key  	The tracking key
 */
function autoTrackWindow($win, key) {
	if (_.isEmpty(key)) {
		Ti.API.warn('Flow: empty key for tracking');
		return;
	}

	// Track screen with GA
	if (config.trackWithGA) {
		GA.trackScreen(key);
	}

	// Track timing with GA
	if (config.trackTimingWithGA) {
		if ($win == null) return;

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
	delete windows[e.source._flowid];
	windowsId = _.without(windowsId, e.source._flowid);
}


/**
 * Set current Window and push in the windows stack
 * @param {Ti.UI.Window} $win
 */
function setCurrentWindow($win) {
	if ($win == null) return;

	var uid = _.uniqueId();
	$win._flowid = uid;

	// Store IDs
	windows[uid] = $win;
	windowsId.push(uid);

	// Add listener
	$win.addEventListener('close', onWindowClose);
}
exports.setCurrentWindow = setCurrentWindow;

/**
 * Get current Window
 * @return {Ti.UI.Window}
 */
function getCurrentWindow() {
	var id = _.last(windowsId);
	if (id == null) return;

	return windows[id];
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
	Navigator = nav;

	if (openNow === true) {
		Navigator.open();

		// If is stored navNextRoute object,
		// forward the request to current navigator
		if (navPreviousRoute !== null) {
			var tmp = { 'open': open, 'openWindow': openWindow };
			tmp[navPreviousRoute.method](navPreviousRoute.arg1, navPreviousRoute.arg2, navPreviousRoute.arg3);
			navPreviousRoute = null;
		}
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
	Ti.API.debug('Flow: openWindow');

	if (Navigator === null) {
		Ti.API.warn('Flow: A NavigationController is not defined yet, waiting for next assignment');
		navPreviousRoute = {
			method: 'openWindow',
			arg1: $win,
			arg2: opt,
			arg3: null
		};
		return;
	}

	if (!_.isEmpty(key)) {
		autoTrackWindow($win, key);
	}

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
	Ti.API.debug('Flow: openDirect', controller, args);

	// Open the controller
	var $c = Alloy.createController(controller, args);
	key = key || $c.analyticsKey || (controller + (args.id?'/'+args.id:''));

	if (!_.isEmpty(key)) {
		GA.trackScreen(key);
	}

	return $c;
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
	Ti.API.debug('Flow: Open', controller, args);

	var $c = Alloy.createController(controller, args);
	var $win = $c.getView();

	key = key || $c.analyticsKey || (controller + (args.id!=null ? '/'+args.id : ''));

	if (Navigator === null) {
		Ti.API.warn('Flow: A NavigationController is not defined yet, waiting for next assignment');
		navPreviousRoute = {
			method: 'open',
			arg1: controller,
			arg2: args,
			arg3: opt
		};
		return;
	}

	// Open the window
	Navigator.openWindow($win, opt.openArgs || {});

	// Attach events
	setCurrentWindow($win);
	autoTrackWindow($win, key);

	// Clean up controller on window close
	$win.addEventListener('close', function(){
		$c.destroy();
		$c.off();
		if (_.isFunction($c.cleanup)) $c.cleanup();
	});

	currentControllerName = controller;
	currentControllerArgs = args;
	currentController = $c;

	return controller;
}
exports.open = open;


/**
 * Close current Navigatgor and all windows associated with it
 */
function close() {
	if (Navigator === null) return;

	windows = {};
	windowsId = [];
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
		controller: currentController,
		controllerName: currentControllerName,
		args: currentControllerArgs,
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
	currentController = controller;
}
exports.setCurrentController = setCurrentController;

/**
 * Return current controller
 *
 * @return {Alloy.Controller}
 */
function getCurrentController() {
	return currentController;
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
		order: windowsId,
		windows: windows
	};
}
exports.getStack = getStack;
