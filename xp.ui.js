/*

XP.UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/

if (OS_ANDROID) {
	var NavigationWindow = function(args) {
		this.args = args;
	};

	NavigationWindow.prototype.open = function(params) {
		return this.openWindow(this.args.window, params || {});
	};

	NavigationWindow.prototype.close = function(params) {
		return this.closeWindow(this.args.window, params || {});
	};

	NavigationWindow.prototype.openWindow = function(window, params) {
		params = params || {};

		if (OS_ANDROID) {

			// Perform animations
			if (params.animated!==false) {
				if (params.modal) {
					params.activityEnterAnimation = Ti.Android.R.anim.fade_in;
					params.activityExitAnimation = Ti.Android.R.anim.fade_out;
				} else {
					params.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
					params.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
				}
			}

			// Auto add the RightNavButton
			if (window.rightNavButton && window.rightNavButton.children[0]) {
				while (window.rightNavButton.children[0])
					window.rightNavButton = window.rightNavButton.children[0];

				window.activity.onCreateOptionsMenu = function(e){
					var menuItem = e.menu.add({
						title: window.rightNavButton.title || 'Button',
						icon: window.rightNavButton.icon || window.rightNavButton.image || '',
						showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
					});
					menuItem.addEventListener('click', function(){
						window.rightNavButton.fireEvent('click');
					});
				};
			}

		}

		return window.open(_.extend(params));
	};

	NavigationWindow.prototype.closeWindow = function(window, params) {
		return window.close(params || {});
	};
}

exports.createNavigationWindow = function(args) {
	return OS_IOS ? Ti.UI.iOS.createNavigationWindow(args) : new NavigationWindow(args);
};

exports.createWindow = function(args) {
	return OS_IOS ? Ti.UI.createWindow(args) : Ti.UI.createView(args);
};

exports.createTextArea = function(args) {
	var ui = Ti.UI.createTextArea(args);

	if (OS_IOS && args.hintText) {

		ui.originalColor = ui.color || '#000';
		if (!ui.value) {
			ui.applyProperties({
				value: ui.hintText,
				color: '#ccc'
			});
		}

		ui.addEventListener('focus', function(e){
			if (e.source.value!=e.source.hintText) return;
			e.source.applyProperties({
				value: '',
				color: e.source.originalColor
			});
		});

		ui.addEventListener('blur', function(e){
			if (e.source.value) return;
			e.source.applyProperties({
				value: e.source.hintText,
				color: '#ccc'
			});
		});
	}

	return ui;
};