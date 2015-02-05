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

var Event = require('T/event');

var Navigator = null; // Current navigator
var windows = [];
var currentController = null;


function open(name, args, openArgs, key, useNav) {
	args = args || {};
	openArgs = openArgs || {};

	var controller = Alloy.createController(name, args);
	key = key || controller.analyticsKey || (name + (args.id ? '/' + args.id : ''));

	// Get the main window an track focus/blur
	var $window = controller.getView();
	if ($window != null) {
		exports.track(key, $window);
		exports.setCurrentWindow($window);
	}

	// Clean up controller on window close
	if ($window != null) {
		$window.addEventListener('close', function() {
			controller.destroy(); // Destroy by KrolllBridge
			controller.off(); // Turn off Backbone Events
			if (_.isFunction(controller.cleanup)) controller.cleanup(); // Custom cleanup

			controller = null;
			$window = null;
		});
	}

	// Open the window
	if (useNav) {
		Navigator.openWindow($window, openArgs);
	} else {
		if (_.isFunction(controller.open)) {
			controller.open(openArgs);
		}
	}

	exports.currentControllerName = name;
	exports.currentControllerArgs = args;
	currentController = controller;

	return controller;
}

function onWindowClose(e) {
	var flowId = e.source._flowid;
	var index = _.findWhere(windows, { flowId: flowId });
	if (index >= 0) {
		windows.splice(index, 1);
		Event.trigger('flow.close', {
			flowId: flowId,
		});
	}
}


/**
 * @property currentControllerName
 * @type {Object}
 */
exports.currentControllerName = null;

/**
 * @property currentControllerArgs
 * @type {Object}
 */
exports.currentControllerArgs = null;

/**
 * @method event
 */
exports.event = function(name, cb) {
	Event.on('flow.'+name, cb);
};


/**
 * @method track
 * Track the time and the screen of this windows with GA
 *
 * @param  {String} 			key  		The tracking key
 * @param  {Ti.UI.Window} 	[$win] 	The window
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
	windows = [];
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
exports.openDirect = function(name, args, openArgs, key) {
	return open(name, args, openArgs, key, false);
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
		return Ti.API.warn('Flow: A Navigator is not defined yet');
	}

	return open(name, args, openArgs, key, true);
};

/**
 * Close current Navigatgor and all windows associated with it
 */
exports.close = function() {
	if (Navigator === null) return;

	windows = [];
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
 * @method setCurrentWindow
 * Set current Window and push in the windows stack
 * @param {Ti.UI.Window} $win
 */
exports.setCurrentWindow = function($win) {
	if ($win == null) return;

	$win._flowid = _.uniqueId();
	windows.push($win);

	// Add listener
	$win.addEventListener('close', onWindowClose);
};

/**
 * @method getWindows
 * Return the windows stacks
 * @return {Array}
 */
exports.getWindows = function() {
	return windows;
};

/**
 * @method getCurrentWindow
 * Get current Window
 * @return {Ti.UI.Window}
 */
exports.getCurrentWindow = function() {
	return _.last(windows);
};


/**
 * @method setNavigationController
 * Set the Navigator used to open the windows
 *
 * ** This is required before opening windows **
 *
 * @param {Object} 	nav 			The instance of Ti.UI.iOS.NavigationWindow or compatible
 * @param {Boolean} 	[openNow] 	Specify if call instantly the open on the navigator
 */
exports.setNavigationController = function(nav, openNow) {
	Navigator = nav;
	if (openNow === true) {
		Navigator.open();
	}
};


/**
 * @method getNavigationController
 * Return the instance set of Navigator
 * @return {Object}
 */
exports.getNavigationController = function() {
	return Navigator;
};


/**
 * @method closeAllWindowsExceptFirst
 * Close all windows, except first.
 */
exports.closeAllWindowsExceptFirst = function() {
	var wins = _.clone(windows);
	for (var i = wins.length-2; i > 0; i--) {
		wins[i].close({ animated: false });
	}
	wins[wins.length-1].close();
};
