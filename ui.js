/**
 * @class  UI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide new UI elements for Titanium
 *
 * ** non-CommonJS module**
 *
 * You have to use in Alloy with `module="ui"`
 *
 */


/**
 * @method createModalWindow
 * Proxy for https://github.com/CaffeinaLab/com.caffeinalab.titanium.modalwindow
 * @param  {Object} args
 */
exports.createModalWindow = function(args) {
	return Alloy.createWidget("com.caffeinalab.titanium.modalwindow", args);
};

/**
 * @method createModalWebView
 * Provide a simple method to open a *WebView* in a modal window
 *
 * Require https://github.com/CaffeinaLab/com.caffeinalab.titanium.modalwindow
 *
 * @param  {Object} args
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

/**
 * @method createYoutubeVideoWebView
 * View that contain a Youtube video.
 *
 * Internally use a WebView to provide the content.
 *
 * On iOS, clicking on the video cause the video to play in native iOS player in fullscreen.
 *
 * @param  {Object} args [description]
 * @return {Ti.UI.WebView}      [description]
 */
exports.createYoutubeVideoWebView = function(args){
	args = args || {};
	args.disableBounce = true;
	args.willHandleTouches = true;
	args.showScrollbars = false;
	args.scalesPageToFit = false;
	args.hideLoadIndicator = true;
	args.enableZoomControls = false;

	if (OS_ANDROID) {
		args.overScrollMode = Ti.UI.Android.OVER_SCROLL_NEVER;
		args.pluginState = Ti.UI.Android.WEBVIEW_PLUGINS_ON;
	}

	args.youtube = args.youtube || {};
	if (!args.youtube.width) args.youtube.width = args.width;
	if (!args.youtube.height) args.youtube.height = args.height;

	var $ui = Ti.UI.createWebView(args);

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body{padding:0;background:black;margin:0;overflow:hidden;}</style>';
	html += '</head><body><div id="player"></div>';
	html += '<script src="http://www.youtube.com/player_api"></script>';
	html += '<script>function onYouTubePlayerAPIReady(){window.player=new YT.Player("player",'+JSON.stringify(args.youtube)+');}</script>';
	html += '</body></html>';
	$ui.html = html;

	return $ui;
};



exports.createTransformableImageView = function(args) {
	var image = args.image;
	delete args.image;

	var $ui = Ti.UI.createScrollView(_.extend({
		minZoomScale: 0,
		maxZoomScale: 3,
		zoomScale: 1,
		disableBounce: true
	}, args));
	var $img = Ti.UI.createImageView({
		image: image
	});
	$ui.add($img);

	return $ui;
};
