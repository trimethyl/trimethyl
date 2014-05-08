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

	var opt = {};
	if (args.url) {
		opt.url = args.url;
		delete args.url;
	} else if (args.html) {
		opt.html = args.html;
		delete args.html;
	}

	var $modal = Alloy.createWidget("com.caffeinalab.titanium.modalwindow", args);
	$modal.add(Ti.UI.createWebView(opt));
	return $modal;
};

/*
YoutubeVideoWebView
*/
exports.createYoutubeVideoWebView = function(args){
	args = args || {};
	args.disableBounce = true;
	args.willHandleTouches = true;

	if (!args.youtube.width) args.youtube.width = args.width;
	if (!args.youtube.height) args.youtube.height = args.height;
	args.height += 5;

	var $ui = Ti.UI.createWebView(args);

	var html = '<!doctype html><html style="margin:0"><body style="margin:0"><div id="player"></div>';
	html += '<script src="http://www.youtube.com/player_api"></script>';
	html += '<script>function onYouTubePlayerAPIReady() { window.player = new YT.Player("player",'+JSON.stringify(args.youtube) + '); }</script>';
	html += '</body></html>';

	$ui.html = html;

	return $ui;
};
