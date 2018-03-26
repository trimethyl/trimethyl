/**
 * @module  uifactory/facebookvideowebview
 * @author  Ani Sinanaj <ani.sinanaj@caffeina.com>
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
		 * @property {String} videoId ID of facebook video.
		 */
		videoId: null,

		/**
		 * @property {Object} [props={}] Properties for the Facebook player API.
		 */
		props: {}

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

	var props = _.extend(_.pick(args, 'videoId'), args.props);
	
	if (props.width == null && props.container_width == null) {
		props.width = parseInt(args.width);
		props.container_width = parseInt(args.width);
	}
	
	if (props.height == null) props.height = args.height;

	args.height = +args.height + 5; // The height of the WebView must be just a little higher to prevent the scrolling inside
	var $this = Ti.UI.createWebView(args);

	var attributeProps = [];
	_(props).each(function(prop, key) {
		attributeProps.push(key + "=" + encodeURIComponent(prop) +"");
	});
	if (args.videoId) {
		attributeProps.push("href" + "=" + encodeURIComponent("https://facebook.com/video.php?v=" + args.videoId));
	}
	attributeProps = attributeProps.join("&");

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body{padding:0;background:black;margin:0;overflow:hidden;} .fb-video { top: 50%; position: absolute; margin-top: -'+(args.height / 2)+'px; background-color: #fff; } #table {display: table; position: absolute; width: 100%; height: 100%} #container {display: table-cell; vertical-align: middle;}</style>';
	html += '</head><body><div id="fb-root"></div><div id="table"><div id="container">';
	html += '<iframe class="" src="https://www.facebook.com/v2.5/plugins/video.php?'+attributeProps+'&sdk=joey" frameborder="0" width="'+args.width + '" ' + (OS_IOS ? '' : 'height="'+args.height+'"')+'>';
	html += '</div></div></body></html>';
	
	if (OS_IOS) {
		$this.html = html;
	} else {
		$this.setHtml(html);
	}

	return $this;
};
