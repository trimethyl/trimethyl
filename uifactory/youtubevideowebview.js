/**
 * @class  UIFactory.YoutubeVideoWebView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * View that contain a Youtube video.
 *
 * Internally use a WebView to provide the content.
 *
 * On iOS, clicking on the video cause the video to play in native iOS player in fullscreen.
 *
 * @param  {Object} args [description]
 * @return {Ti.UI.WebView}      [description]
 */

module.exports = function(args) {
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

	var $this = Ti.UI.createWebView(args);

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body { padding:0; background:black; margin:0; overflow:hidden; }</style>';
	html += '</head><body><div id="player"></div>';
	html += '<script src="http://www.youtube.com/player_api"></script>';
	html += '<script>function onYouTubePlayerAPIReady() { window.player = new YT.Player("player",' + JSON.stringify(args.youtube) + ');}</script>';
	html += '</body></html>';
	$this.html = html;

	return $this;
};