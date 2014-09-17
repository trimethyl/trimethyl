/**
 * @class  UI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide new UI elements for Titanium
 *
 * ** non-CommonJS module**
 *
 * You have to use in Alloy with `module="T/ui"`
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

	var webViewArgs = {};
	if (args.url != null) {
		webViewArgs.url = args.url;
		delete args.url;
	} else if (args.html != null) {
		webViewArgs.html = args.html;
		delete args.html;
	}

	var $modal = Alloy.createWidget("com.caffeinalab.titanium.modalwindow", args);
	$modal.add(Ti.UI.createWebView(webViewArgs));
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
	args = _.extend(args, {
		disableBounce : true,
		willHandleTouches : true,
		showScrollbars : false,
		scalesPageToFit : false,
		hideLoadIndicator : true,
		enableZoomControls : false,
		youtube: {}
	},
	OS_ANDROID ? {
		overScrollMode : Ti.UI.Android.OVER_SCROLL_NEVER,
		pluginState : Ti.UI.Android.WEBVIEW_PLUGINS_ON
	} : {});

	if (args.youtube.width == null) args.youtube.width = args.width;
	if (args.youtube.height == null) args.youtube.height = args.height;

	var $ui = Ti.UI.createWebView(args);

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body { padding:0; background:black; margin:0; overflow:hidden; }</style>';
	html += '</head><body><div id="player"></div>';
	html += '<script src="http://www.youtube.com/player_api"></script>';
	html += '<script>function onYouTubePlayerAPIReady() { window.player = new YT.Player("player",' + JSON.stringify(args.youtube) + ');}</script>';
	html += '</body></html>';
	$ui.html = html;

	return $ui;
};
