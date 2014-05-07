/*

UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/

/*
TabView
- A TabView withouts tabs
*/

exports.createTabView = function(args) {
	var $this = Ti.UI.createView(args);

	$this.setActive = function(i) {
		$this.activeViewIndex = +i;
		_.each($this.children, function($el, k){
			if (i==+k) {
				$el.visible = true;
				if ($el.id) {
					$this.activeViewId = $el.id;
				}
			} else {
				$el.visible = false;
			}
		});
	};

	return $this;
};

/*
ModalWindow
*/
exports.createModalWindow = function(args) {
	return Alloy.createWidget("com.caffeinalab.titanium.modalwindow", args);
};

/*
ModalWebView
*/
exports.createModalWebView = function(args) {
	args = args || {};

	var url = args.url;
	delete args.url;

	var $modal = Alloy.createWidget("com.caffeinalab.titanium.modalwindow", args);
	$modal.add(Ti.UI.createWebView({
		url: url
	}));

	return $modal;
};