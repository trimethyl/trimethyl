/**
 * @class  Flow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Manage the app windows flow, tracking optionally with Google Analitycs
 */

/**
 * * **useNav**: Use a Navigation Controller instead opening windows directly. Default: `true`
 * * **trackWithGA**: Send the trackScreen directly to GA module. Default: `true`
 * @type {Object}
 */
var config = _.extend({
	useNav: true,
	trackWithGA: true
}, Alloy.CFG.flow);
exports.config = config;


var $_CC = null;
var $_CCS = null;
var $_CCA = null;

var hist = [];
var $navigationController = null;

/**
 * Set the navigation controller used to open windows
 *
 * @param {XP.UI.NavigationWindow} navigationController The instance of the navigation controller
 * @param {Boolean} [openNow] Specify if call instantly the open on the navigation controller
 */
function setNavigationController(navigationController, openNow) {
	$navigationController = navigationController;
	if (openNow) $navigationController.open();
}
exports.setNavigationController = setNavigationController;


/**
 * Return the instance set of navigation controller
 *
 * @return {XP.UI.NavigationWindow} The navigation controller
 */
function getNavigationController() {
	return $navigationController;
}
exports.getNavigationController = getNavigationController;


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
 * Require an Alloy.Controller without passing it to the navigation window
 *
 * This is tracked with Google Analitycs
 *
 * @param  {String} controller The name of the controller
 * @param  {Object} [args]     The args passed to the controller
 */
function openDirect(controller, args) {
	Ti.API.debug("Flow: opening directly '"+controller+"' with args "+JSON.stringify(args));

	// Open the controller
	var $C = Alloy.createController(controller, args || {});

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('ga').trackScreen(controller);
	}

	return $C;
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
 * If an `init` function is attached to the controller, is automatically
 * called on window open
 *
 * This is tracked with Google Analitycs
 *
 * @param  {String} controller The name of the controller
 * @param  {Object} [args]       The arguments passed to the controller
 * @param  {Object} [opt]        The arguments passed to the NavigationWindow.openWindow or the Controller.Window.open
 * @return {Alloy.Controller}    The controller instance
 */
function open(controller, args, opt) {
	args = args || {};
	opt = opt || {};

	if (ENV_DEVELOPMENT) {
		Ti.API.debug("Flow: opening '"+controller+"' with args "+JSON.stringify(args));
	}

	var $C = Alloy.createController(controller, args);
	var $W = $C.getView();

	if (config.useNav) {

		if (!$navigationController) {
			Ti.API.debug("Flow: please define a NavigationController or set Flow.useNav to false");
			return;
		}
		$navigationController.openWindow($W, opt.openArgs || {});

	} else {
		$W.open(opt.openArgs || {});
	}

	// Attach events

	$W.addEventListener('close', function(e){
		if ('beforeDestroy' in $C) C.beforeDestroy();
		$C.destroy();
		$C = null;
		$W = null;
	});

	$W.addEventListener('open', function(e){
		if ('init' in $C) $C.init();
	});

	// Track with Google Analitycs
	if (config.trackWithGA) {
		require('ga').trackScreen(controller);
	}

	hist.push({
		controller: controller,
		args: args
	});

	if (!config.useNav && !opt.singleTask) {
		if ($_CC) closeController($_CC);
	}

	$_CCS = controller;
	$_CCA = args;
	$_CC = $C;

	return $_CC;
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
 * Get an object with current controller and args
 *
 * @return {Object} [description]
 */
function getCurrent() {
	return {
		controller: $_CCS,
		args: $_CCA
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
	return $_CC;
}
exports.getCurrentController = getCurrentController;


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
	closeController($_CC);
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