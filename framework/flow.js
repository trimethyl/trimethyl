/**
 * @module  flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property [config.antiBounce=true] 	Add an anti bounce to avoid double triggering of open windows
 * @property [config.log=false]			Log the opening of controllers
 */
exports.config = _.extend({
	antiBounce: true,
	log: false
}, Alloy.CFG.T ? Alloy.CFG.T.flow : {});

var Event = require('T/event');

var Navigator = null;
var windowsStack = [];
var currentController = null;

var controllerBouncing = {};

/**
 * Current controller name
 * @type {Object}
 */
exports.currentControllerName = null;

/**
 * Current controller arguments
 * @type {Object}
 */
exports.currentControllerArgs = null;

/**
 * Attach event to current module
 */
exports.event = function(name, cb) {
	Event.on('flow.' + name, cb);
};

function track($window, route) {
	// Track screen with GA
	require('T/ga').trackScreen(route);

	// Track timing with GA
	var startFocusTime = null;

	$window.addEventListener('focus', function(){
		startFocusTime = Date.now();
	});

	$window.addEventListener('blur', function(){
		if (startFocusTime === null) return;
		require('T/ga').trackTiming(route, Date.now() - startFocusTime);
	});
}

function open(name, args, openArgs, route, useNav) {
	args = args || {};
	openArgs = openArgs || {};
	route = route || name;

	if (exports.config.log) {
		Ti.API.trace("Flow: opening controller <" + name + ">");
	}

	if (name in controllerBouncing) {
		Ti.API.warn("Flow: Trying to open twice the controller <" + name + "> - avoided by anti bounce system");
		return;
	}

	controllerBouncing[ name ] = true;
	// Avoid that, if the listener is never called, the antibounce system will block all future opens
	setTimeout(function() {
		delete controllerBouncing[ name ];
	}, 500);

	var controller = Alloy.createController(name, args);
	exports.setCurrentController(controller, name, args);

	// Get the main window to track focus/blur
	var $window = controller.getView();

	// Check if the getView is a NavigationController, in that case, $window is the subwindow
	if ($window.window) $window = $window.window;

	exports.setCurrentWindow($window, route);

	// Clean up controller on window close
	$window.addEventListener('close', function() {
		controller.trigger('close');

		controller.off(); // Turn off Backbone Events
		controller.destroy(); // Destroy by Kroll Bridge

		if (_.isFunction(controller.cleanup)) {
			controller.cleanup();
		}

		controller = null;
		$window = null;
	});

	$window.addEventListener('open', function() {
		delete controllerBouncing[ name ];
		controller.trigger('open');
	});

	// Open the window
	if (useNav) {

		if (/NavigationWindow/.test(Navigator.apiName)) {
			Navigator.openWindow($window, openArgs);
		} else if (Navigator.apiName === "Ti.UI.Tab") {
			Navigator.open($window, openArgs);
		} else {
			throw new Error('Flow: incompatible navigator');
		}

	} else {
		if (_.isFunction(controller.open)) {
			controller.open(openArgs);
		} else {
			$window.open(openArgs);
		}
	}

	return controller;
}

function onWindowClose(e) {
	var route = e.source._route;
	Event.trigger('flow.close', {
		route: route,
	});

	var index = -1;
	for (var k in windowsStack) {
		if (windowsStack[k]._route === route) {
			windowsStack.splice(+k, 1);
			return;
		}
	}
}

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
	// Reset variables
	windowsStack = [];

	exports.setCurrentWindow(win, '/' + controllerName);
	exports.setCurrentController(controller, controllerName, controllerArgs);
	exports.setNavigationController(nav, true);
};


/**
 * Require an Alloy.Controller without passing it to the Navigator
 *
 * This is anyway tracked with Google Analitycs
 *
 * @param  {String} 	name 				The name of the controller
 * @param  {Object} 	[args]     		The args passed to the controller
 * @param  {String} 	[route]				Optional route that identify this controller
 * @return {Alloy.Controller} 		The controller instance
 */
exports.openDirect = function(name, args, openArgs, route) {
	return open(name, args, openArgs, route, false);
};

/**
 * Require an Alloy.Controller and open its main `View` in the Navigator.
 *
 * A `close` event is automatically attached to the main window to call sequentially
 * `Controller.cleanup` (if defined) and `Controller.destroy`
 *
 * This is tracked with Google Analitycs
 *
 * @param  {String} 	name 				The name of the controller
 * @param  {Object} 	[args]       	The arguments passed to the controller
 * @param  {Object} 	[openArgs]     The arguments passed to the `Navigator.openWindow` or `Tab.open`
 * @param  {String} 	[route]			Optional route that identify this controller
 * @return {Alloy.Controller}    	The controller instance
 */
exports.open = function(name, args, openArgs, route) {
	if (Navigator === null) {
		throw new Error('Flow: A Navigator is not defined yet. You have to call Flow.setNavigationController upfront.');
	}

	return open(name, args, openArgs, route, true);
};

/**
 * Close current Navigatgor and all windows associated with it
 */
exports.close = function() {
	if (Navigator === null) return;

	windowsStack = [];
	Navigator.close();
	Navigator = null;
};

/**
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
 * Return current controller
 * @return {Alloy.Controller}
 */
exports.getCurrentController = function() {
	return currentController;
};

/**
 * Set current Window and push in the windows stack
 * @param {Ti.UI.Window} $window
 * @param {String} route
 */
exports.setCurrentWindow = function($window, route) {
	$window._route = route;
	windowsStack.push($window);

	// Track with GA
	track($window, route);

	// Add listener
	$window.addEventListener('close', onWindowClose);
};

/**
 * Return the windows stacks
 * @return {Array}
 */
exports.getWindows = function() {
	return windowsStack;
};

/**
 * Get current Window
 * @return {Ti.UI.Window}
 */
exports.getCurrentWindow = function() {
	return _.last(windowsStack);
};


/**
 * Set the Navigator used to open the windows
 *
 * ** This is required before opening windows **
 *
 * @param {Object} 	nav 			An instance of `NavigationWindow` or a `TabGroup`
 * @param {Boolean} 	[openNow] 	Specify if call instantly the open on the navigator
 */
exports.setNavigationController = function(nav, openNow) {
	Navigator = nav;
	if (openNow === true) {
		Navigator.open();
	}
};


/**
 * Return the instance set of Navigator
 * @return {Object}
 */
exports.getNavigationController = function() {
	return Navigator;
};


/**
 * Close all windows, except first.
 */
exports.closeAllWindowsExceptFirst = function() {
	if (windowsStack.length < 2) return;

	var wins = _.clone(windowsStack);

	for (var i = wins.length-2; i > 0; i--) {
		wins[i].close({ animated: false });
	}
	wins[wins.length-1].close();
};
