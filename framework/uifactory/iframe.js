/**
 * @module  uifactory/iframe
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	_.defaults(args, {

		width: Alloy.Globals.SCREEN_WIDTH,
		height: Alloy.Globals.SCREEN_WIDTH * (3/4),

		/**
		 * @property {String} URL to render in the iframe.
		 */
		url: null,

		/**
		 * @property {String} The whole html iframe you want to render inside the webview
		 */
		iframe: ""

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

	args.height = +args.height + 5; // The height of the WebView must be just a little higher to prevent the scrolling inside
	var $this = Ti.UI.createWebView(args);

	var html = '<!doctype html><html><head>';
	html += '<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />';
	html += '<style>html,body{padding:0;background:white;margin:0;overflow:hidden;}</style>';
	html += '</head>';
	if ( "" !== args.iframe) {
		html += "iframe";
	} else if (null !== args.url) {
		html += "<iframe src=\"" + args.url + "\" width=\"100%\" height=\"" + (args.height - 10) + "\"></iframe>";
	}
	html += '</body></html>';
	if (OS_IOS) {
		$this.html = html;
	} else {
		$this.setHtml(html);
	}

	return $this;
};
