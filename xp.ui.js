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
		if (OS_ANDROID && params.animated!==false) {
			if (params.modal) {
				params.activityEnterAnimation = Ti.Android.R.anim.fade_in;
				params.activityExitAnimation = Ti.Android.R.anim.fade_out;
			} else {
				params.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
				params.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
			}
		}
		return window.open(_.extend(params, { modal: false })); // Heavyweight
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
	var $textArea = Ti.UI.createTextArea(args);

	if (args.hintText) {
		$textArea.originalColor = $textArea.color || '#000';
		if (!$textArea.value) {
			$textArea.applyProperties({
				value: $textArea.hintText,
				color: '#ccc'
			});
		}

		$textArea.addEventListener('focus', function(e){
			if (e.source.value==e.source.hintText) {
				e.source.applyProperties({
					value: '',
					color: e.source.originalColor
				});
			}
		});

		$textArea.addEventListener('blur', function(e){
			if (!e.source.value) {
				e.source.applyProperties({
					value: e.source.hintText,
					color: '#ccc'
				});
			}
		});
	}

	return $textArea;
};