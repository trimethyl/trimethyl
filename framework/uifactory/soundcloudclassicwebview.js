/**
 * @module  uifactory/soundcloudclassicwebview
 * @author  Ani Sinanaj <ani.sinanaj@caffeina.com>
 *
 * View that contain a SoundCloud audio player. Internally uses a WebView to provide the content.
 *
 * To provide the Audio ID, you need to pass to the `audioId` property.
 * All properties set in the `soundcloud` property are passed as arguments in the iframe url.
 *
 * @usage
 *
 * // calling module passing all the properties. url overrides audioId and props
 *	var audio = T('uifactory/soundcloudclassicwebview');
 *	container.add(audio({
 *		audioId: id,
 *		//url: e.attributes["data-url"],
 *		//soundcloud: props
 *	}));
 */

module.exports = function(args) {
	_.defaults(args, {

		width: Ti.UI.FILL,
		height: 166,

		/**
		 * @property {String} audioId ID of Soundcloud track.
		 */
		audioId: null,

		/**
		 * @property {String} url of the track (Must be escaped).
		 */
		url: null,

		/**
		 * @property {Object} [youtube={}] Properties for YT Web Player API.
		 */
		soundcloud: {
			auto_play: false,
			hide_related: true,
			show_comments: false,
			show_user: false,
			show_reposts: false,
			buying: false,
			liking: false,
			download: false,
			sharing: false,
			show_artwork: false,
			show_playcount: false
		}

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

	var opts = [];
	_.each(_.pairs(args.soundcloud), function(a) {
		return opts.push(a.join("="));
	});
	var yt = _.extend(_.pick(args, 'audioId'), args.soundcloud);
	var scPlayer = "https://w.soundcloud.com";
	var trackURL = (args.url || "https://api.soundcloud.com/tracks/" + args.audioId + "&" + opts.join("&"));

	if (yt.width == null) yt.width = args.width;
	if (yt.height == null) yt.height = args.height - 10;

	args.height = +args.height + 5; // The height of the WebView must be just a little higher to prevent the scrolling inside
	var $this = Ti.UI.createWebView(args);
	if (trackURL.indexOf(scPlayer) != -1 ) {
		$this.url = trackURL;
	}
	else {
		$this.url = scPlayer + "/player?url="+ trackURL;
	}

	$this.addEventListener("load", function() {
		$this.evalJS('var elements = document.getElementsByClassName("mobilePrestitial"); while(elements.length > 0){ var parent = elements[0].parentNode; parent.removeChild(elements[0]); parent.parentNode.removeChild(parent);}');
	});

	return $this;

	// as seen in http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
	function escapeHtml(unsafe) {
	    return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
		.replace(/:/g, "%3A");
	}
};