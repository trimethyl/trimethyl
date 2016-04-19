/**
 * @module  uifactory/navigationwindow
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * Simple stack of `Ti.UI.iOS.NavigationWindow`
 */

function NavigationWindow(args) {
	this.windows = [];
	this.window = args.window || null;
	this.apiName = "Ti.UI.Android.NavigationWindow";
}

NavigationWindow.prototype.open = function(opt) {
	if (this.window == null) {
		Ti.API.error('UIFactory.NavigationWindow: no window defined in NavigationWindow');
		return false;
	}

	this.openWindow(this.window, opt);
};

NavigationWindow.prototype.close = function(callback) {
	var self = this;

	(function _close() {
		if (self.windows.length === 0) {
			if (_.isFunction(callback)) callback();
			return;
		}

		var w = self.windows.shift();
		w.removeEventListener('close', w.__onClose);
		w.addEventListener('close', _close);
		w.close({
			animated: self.windows.length === 0
		});
	})();
};

NavigationWindow.prototype.openWindow = function(window, opt) {
	var self = this;
	opt = opt || {};

	window.navigationIndex = this.windows.length;
	window.__onClose = function() {
		self.windows.splice(window.navigationIndex, 1);
		self.window = _.last(self.windows);
	};
	window.addEventListener('close', window.__onClose);

	this.windows.push(window);
	this.window = window;

	opt.modal = false; // set anyway to false to prevent heavyweight windows
	this.window.open(opt);
};

NavigationWindow.prototype.closeWindow = function(window) {
	window.close();
};

NavigationWindow.prototype.getWindow = function() {
	return this.window;
};

_.each([
	'animate',
	'addEventListener',
	'applyProperties',
	'convertPointToView',
	'fireEvent',
	'hide',
	'remove',
	'show',
	'toImage',

	'setBackgroundColor',
	'setBackgroundImage',
	'setBackgroundRepeat',
	'setBorderColor',
	'setBorderRadius',
	'setBorderWidth',
	'setFullscreen',
	'setHeight',
	'setHorizontalWrap',
	'setLayout',
	'setOpacity',
	'setOrientationModes',
	'setTouchEnabled',
	'setTransform',
	'setVisible',

	'getBackgroundColor',
	'getBackgroundImage',
	'getBackgroundRepeat',
	'getBorderColor',
	'getBorderRadius',
	'getBorderWidth',
	'getFullscreen',
	'getHeight',
	'getHorizontalWrap',
	'getLayout',
	'getOpacity',
	'getOrientationModes',
	'getTouchEnabled',
	'getTransform',
	'getVisible'
], function(method) {
	NavigationWindow.prototype[method] = function() {
		return this.window[method].apply(this.window, arguments);
	};
});

// Extension

NavigationWindow.prototype.getWindowsStack = function() {
	return this.windows;
};

module.exports = NavigationWindow;