module.exports = function NavigationWindow(args) {
	if (!(this instanceof NavigationWindow)) {
		return new NavigationWindow(args);
	}

	args = args || {};
	var self = this;

	self.windows = [];
	self.window = args.window || null;

	function onWindowClose(e) {
		var window = e.source;
		if (_.isNumber(window.navigationIndex)) {
			self.windows.splice(window.navigationWindow, 1);
			self.window = _.last(self.windows);
		}
	}

	self.open = function(opt) {
		if (args.window == null) {
			Ti.API.error('XP.UI: no window defined in NavigationWindow');
			return false;
		}

		self.openWindow(args.window, opt);
	};

	self.close = function(callback) {
		(function _close() {
			if (self.windows.length === 0) {
				if (_.isFunction(callback)) callback();
				return;
			}

			var w = self.windows.pop();
			w.removeEventListener('close', onWindowClose);
			w.addEventListener('close', _close);
			w.close({ animated: false });
		})();
	};

	self.openWindow = function(window, opt) {
		opt = opt || {};

		if (OS_ANDROID) {
			if (opt.animated !== false && window.animated !== false) {
				opt.animated = true;
				if (opt.modal === true) {
					opt.activityEnterAnimation = Ti.Android.R.anim.fade_in;
					opt.activityExitAnimation = Ti.Android.R.anim.fade_out;
				} else {
					opt.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
					opt.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
				}
				opt.modal = false; // set anyway to false to prevent heavyweight windows
			} else {
				opt.animated = true;
			}
		}

		window.navigationIndex = +self.windows.length;
		window.addEventListener('close', onWindowClose);

		self.windows.push(window);
		self.window = window; // expose property

		window.open(opt);
	};

	self.closeWindow = function(window) {
		window.close();
	};

	self.getWindowsStack = function() {
		return self.windows;
	};

	return self;
};
