/*

XP.UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/

if (!OS_IOS) {

	var NavigationWindow = function(args) {
		this.args = args;
	};

	NavigationWindow.prototype.open = function(params) {
		return this.openWindow(this.args.window, params||{});
	};

	NavigationWindow.prototype.close = function(params) {
		return this.closeWindow(this.args.window, params||{});
	};

	NavigationWindow.prototype.openWindow = function(window, params) {
		params = params || {};
		if (OS_ANDROID && params.animated!==false) {
			if (params.modal) {
				params.activityEnterAnimation = Ti.Android.R.anim.fade_in;
				params.activityExitAnimation = Ti.Android.R.anim.fade_out;
			} else {
				params.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
				params.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
			}
		}
		return window.open(_.extend(params, { modal: false }));
	};

	NavigationWindow.prototype.closeWindow = function(window, params) {
		params = params || {};
		return window.close(params);
	};
}

exports.createNavigationWindow = function(args) {
	return OS_IOS ? Ti.UI.iOS.createNavigationWindow(args) : new NavigationWindow(args);
};

exports.createWindow = function(args) {
	return OS_IOS ? Ti.UI.createWindow(args) : Ti.UI.createView(args);
};