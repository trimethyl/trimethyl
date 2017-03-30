/**
 * @module  uifactory/youtubevideowebview
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * View that contain a Youtube video. Internally use a WebView to provide the content.
 *
 * To provide the Video ID, you need to pass to the `videoId` property.
 * All property set in the `youtube` property are passed into the Youtube API.
 *
 * On iOS, clicking on the video cause the video to play in native iOS player in fullscreen.
 *
 * More info at [https://developers.google.com/youtube/iframe_api_reference](https://developers.google.com/youtube/iframe_api_reference)
 *
 */

module.exports = function(args) {
	_.defaults(args, {

		width: Alloy.Globals.SCREEN_WIDTH,
		height: Alloy.Globals.SCREEN_WIDTH * (3/4),

		/**
		 * @property {String} videoId ID of Youtube video.
		 */
		videoId: null,

		/**
		 * @property {Object} [youtube={}] Properties for YT Web Player API.
		 */
		youtube: {}

	});
	_.extend(args, {
		disableBounce : true,
		willHandleTouches : true,
		showScrollbars : false,
		scalesPageToFit : false,
		hideLoadIndicator : true,
		enableZoomControls : false,
	},
	OS_ANDROID ? {
		overScrollMode : Ti.UI.Android.OVER_SCROLL_NEVER,
		pluginState : Ti.UI.Android.WEBVIEW_PLUGINS_ON
	} : {}
	);

	var yt = _.extend(_.pick(args, 'videoId'), args.youtube);
	if (yt.width == null) yt.width = args.width;
	if (yt.height == null) yt.height = args.height;

	args.height = +args.height + 5; // The height of the WebView must be just a little higher to prevent the scrolling inside
	var $this = Ti.UI.createWebView(args);

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body{padding:0;background:black;margin:0;overflow:hidden;}</style>';
	html += '</head><body><div id="player"></div>';
	html += '<script src="https://www.youtube.com/player_api"></script>';
	html += '<script>function onYouTubePlayerAPIReady() { window.player = new YT.Player("player",' + JSON.stringify(yt) + '); }</script>';
	html += '</body></html>';
	if (OS_IOS) {
		$this.html = html;
	} else {
		$this.setHtml(html);
	}

	return $this;
};
