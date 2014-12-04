/**
 * @class  	Flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Boolean} [config.trackWithGA=true] Send the trackScreen to GA
 * @property {Boolean} [config.trackTimingWithGA=true] Track the timing of focus/blur of the window to GA
 */
exports.config = _.extend({
	trackWithGA: true,
	trackTimingWithGA: true
}, Alloy.CFG.T ? Alloy.CFG.T.flow : {});

var Navigator = null; // Current navigator

var windows = {}; // all windows objects
var windowsId = []; // all windows id

var currentController = null;
exports.currentControllerName = null;
exports.currentControllerArgs = null;


function onWindowClose(e) {
	delete windows[e.source._flowid];
	windowsId = _.without(windowsId, e.source._flowid);
}


/**
 * @method track
 * Track the time and the screen of this windows with GA
 *
 * @param  {String} 			key  	The tracking key
 * @param  {Ti.UI.Window} 	$win 	The window
 */
exports.track = function(key, $win) {
	if (_.isEmpty(key)) {
		return Ti.API.warn('Flow: empty key for tracking');
	}

	// Track screen with GA
	if (exports.config.trackWithGA) {
		require('T/ga').trackScreen(key);
	}

	// Track timing with GA
	if (exports.config.trackTimingWithGA) {
		if ($win != null) {
			var startFocusTime = null;
			$win.addEventListener('focus', function(){
				startFocusTime = Date.now();
			});
			$win.addEventListener('blur', function(){
				if (startFocusTime === null) return;
				require('T/ga').trackTiming(key, Date.now() - startFocusTime);
			});
		}
	}
};


/**
 * Set, in a single way, the global Navigator (and open it), the Index-Controller and the Index-Window
 *
 * This method, is typically called on startup, on the index.js, like this:
 *
 * ```
 * Flow.startup($, $.nav, $.win, 'index', {});
 * ```
 *
 * @param  {Alloy.Controller} 				controller
 * @param  {Ti.UI.iOS.NavigationWindow} 	nav
 * @param  {Ti.UI.Window} 						win
 * @param  {String}								controllerName
 * @param  {String}								controllerArgs
 */
exports.startup = function(controller, nav, win, controllerName, controllerArgs) {
	exports.setCurrentWindow(win);
	exports.setCurrentController(controller, controllerName, controllerArgs);
	exports.setNavigationController(nav, true);
	// Reset variables
	windows = {};
	windowsId = [];
};


/**
 * @method openDirect
 * Require an Alloy.Controller without passing it to the Navigator
 *
 * This is anyway tracked with Google Analitycs
 *
 * @param  {String} 	name 				The name of the controller
 * @param  {Object} 	[args]     		The args passed to the controller
 * @param  {String} 	[key]				Optional key that identify this controller
 * @return {Alloy.Controller} 		The controller instance
 */
exports.openDirect = function(name, args, key) {
	args = args || {};

	var controller = Alloy.createController(name, args);
	key = key || controller.analyticsKey || (name + (args.id ? '/' + args.id : ''));

	exports.track(key);

	return controller;
};


/**
 * @method open
 * Require an Alloy.Controller and open its main `View` in the Navigator.
 *
 * A `close` event is automatically attached to the main window to call sequentially
 * `Controller.cleanup` (if defined) and `Controller.destroy`
 *
 * This is tracked with Google Analitycs
 *
 * @param  {String} 	name 				The name of the controller
 * @param  {Object} 	[args]       	The arguments passed to the controller
 * @param  {Object} 	[openArgs]     The arguments passed to the `Navigator.openWindow`
 * @param  {String} 	[key]				Optional key that identify this controller
 * @return {Alloy.Controller}    	The controller instance
 */
exports.open = function(name, args, openArgs, key) {
	if (Navigator === null) {
		return Ti.API.warn('Flow: A NavigationController is not defined yet');
	}

	args = args || {};
	openArgs = openArgs || {};

	var controller = Alloy.createController(name, args);
	key = key || controller.analyticsKey || (name + (args.id ? '/' + args.id : ''))

	// Get the main window an track focus/blur
	var $window = controller.getView();
	exports.track(key, $window);

	// Open the window
	Navigator.openWindow($window, openArgs);

	// Attach events
	exports.setCurrentWindow($window);

	// Clean up controller on window close
	$window.addEventListener('close', function() {
		controller.destroy();
		controller.off();
		if (_.isFunction(controller.cleanup)) {
			controller.cleanup();
		}

		controller = null;
		$window = null;
	});

	exports.currentControllerName = name;
	exports.currentControllerArgs = args;
	currentController = controller;

	return controller;
};


/**
 * Close current Navigatgor and all windows associated with it
 */
exports.close = function() {
	if (Navigator === null) return;
	windows = {};
	windowsId = [];
	Navigator.close();
	Navigator = null;
};


/**
 * @method setCurrentController
 * Set current controller
 * @param {Alloy.Controller} 	controller
 * @param {String} 				[name]
 * @param {Object}				[args]
 */
exports.setCurrentController = function(controller, name, args) {
	currentController = controller;
	exports.currentControllerName = name;
	exports.currentControllerArgs = args;
};

/**
 * @method getCurrentController
 * Return current controller
 * @return {Alloy.Controller}
 */
exports.getCurrentController = function() {
	return currentController;
};

/**
 * @method controller
 * @inheritDoc #getCurrentController
 * Alias for {@link #getCurrentController}
 */
exports.controller = exports.getCurrentController;


/**
 * @method setCurrentWindow
 * Set current Window and push in the windows stack
 * @param {Ti.UI.Window} $win
 */
exports.setCurrentWindow = function($win) {
	if ($win == null) return;

	$win._flowid = _.uniqueId();

	// Store IDs
	windows[$win._flowid] = $win;
	windowsId.push($win._flowid);

	// Add listener
	$win.addEventListener('close', onWindowClose);
};


/**
 * @method getCurrentWindow
 * Get current Window
 * @return {Ti.UI.Window}
 */
exports.getCurrentWindow = function() {
	var id = _.last(windowsId);
	if (id == null) return;

	return windows[id];
};

/**
 * @method window
 * @inheritDoc #getCurrentWindow
 * Alias for {@link #getCurrentWindow}
 */
exports.window = exports.getCurrentWindow;


/**
 * @method setNavigationController
 * Set the Navigator used to open the windows
 *
 * ** This is required before opening windows **
 *
 * @param {Object} 	nav 			The instance of Ti.UI.iOS.NavigationWindow or compatible
 * @param {Boolean} 	[openNow] 	Specify if call instantly the open on the navigation controller
 */
exports.setNavigationController = function(nav, openNow) {
	Navigator = nav;
	if (openNow === true) {
		Navigator.open();
	}
};

/**
 * @method getNavigationController
 * Return the instance set of navigation controller
 *
 * @return {Object} The navigation controller
 */
exports.getNavigationController = function() {
	return Navigator;
};

/**
 * @method navigator
 * @inheritDoc #getNavigationController
 * Alias for {@link #getNavigationController}
 */
exports.navigator = exports.getNavigationController;


/**
 * @method getStack
 * Return the windows stacks
 * @return {Object}
 */
exports.getStack = function() {
	return {
		order: windowsId,
		windows: windows
	};
};

/**
 * @method refresh
 */
exports.refresh = function() {
	if (currentController != null && exports.currentControllerName != null) {
		var $previousView = currentController.getView();
		Flow.open(exports.currentControllerName, exports.currentControllerArgs, { animated: false });
		$previousView.close({ animated: false });
	}
};
