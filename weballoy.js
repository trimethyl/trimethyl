/**
 * @class  	WebAlloy
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * This is an entire µ-web-framework to write Titanium-Alloy apps in HTML/CSS/JS, without native objects.
 *
 * The unique method `WebAlloy.createView` create a WebView with static html inside.
 *
 * To work with WebAlloy, you have to replicate the exact structure in the app directory (Alloy).
 *
 * ### Globals
 *
 * #### app.css
 * Global CSS included in each view.
 *
 * #### app.jslocal
 * Global JS included in each view.
 *
 *	#### controllers/foo.jslocal
 *	Javascript file included in the specific controller, after app.jslocal and jquery.jslocal
 *
 * #### views/foo.tpl
 * HTML/TPL (underscore templating system) file that is parsed and written in the static HTML.
 *
 * #### styles/foo.css
 * CSS file included in the specific controller.
 *
 * ### lib/**.jslocal
 * Put your jslocal files here, they are automatically appended at the end of the HTML.
 *
 * When you have replicated this structure, you can just call:
 *
 * ```
 * WebAlloy.createView({
 * 	name: 'foo',
 * 	webdata: { ... },
 * 	...
 * });
 * ```
 *
 * The **name** arg is to specific the files to load.
 *
 * The **webdata** object is passed to the HTML file and rendered with the Undescore template system.
 *
 *	All the other arguments are Ti-UI specific for the classic WebView.
 *
 * ### HTML output
 *
 * So, the final result is an HTML string passed to the WebView, like this:
 *
 * ```
 * <!DOCTYPE html>
 * <html>
 * 	<head>
 * 		... metas ...
 * 		<style>{{ app.css }}</style>
 * 		<style>{{ your_controller.css }}</style>
 * 	</head>
 * 	<body>
 * 		<div id="main">
 * 			{{ controller.tpl (rendered in undescore with webdata argument) }}
 * 		</div>
 * 		<script>{{ lib/**.jslocal }}</script>
 * 		<script>{{ app.jslocal }}</script>
 * 		<script>{{ controller.jslocal }}</script>
 * 	</body>
 * </html>
 * ```
 *
 * ### WebView additional method
 *
 * Basically, you can interact with DOM elements with `evalJS`.
 *
 * There are some proxy methods designed to interact directly:
 *
 * #### render({ data })
 *
 * Re-render the template with new data passed.
 *
 * #### call(...)
 *
 * Call a function in the WebView.
 *
 * For example, `$.wv.call('foo', 1, 2, {x:1})` will be converted to js in `foo(1, 2, {x:1})`.
 *
 * #### $(selector).call(...)
 *
 * Call a function in a DOM-RAW object.
 *
 * #### $(selector).get(...)
 *
 * Get a property of a DOM-RAW object.
 *
 * #### $(selector).set(...)
 *
 * Set a property of a DOM-RAW object.
 *
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.weballoy);
exports.config = config;

var libDir = [];

function embedCSS(f, html) {
	if (html) return '<link rel="stylesheet" href="'+f+'" />';

	var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, f);
	if (!file.exists()) return '';
	var read = file.read().text;
	file = null; // we don't need you anymore
	return '<style type="text/css">'+read+'</style>';
}

function embedJS(f, html) {
	if (html) return '<script type="text/javascript" src="'+f+'"></script>';

	var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, f);
	if (!file.exists()) return '';
	var read = file.read().text;
	file = null; // we don't need you anymore
	return '<script type="text/javascript">'+read+'</script>';
}


/**
 * @method createView
 * @param  {Object} args Arguments for the view.
 * @return {Ti.UI.WebView}
 */
exports.createView = function(args) {
	var $ui = Ti.UI.createWebView(_.extend({
		disableBounce: true,
		backgroundColor: "transparent"
	}, args));

	// Include head (styles)
	var html = '<!DOCTYPE html>';
	html += '<html><head>';
	html += '<meta charset="utf-8" />';
	html += '<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no;" />';

	html += embedCSS('web/app.css');
	html += embedCSS('web/styles/'+args.name+'.css');

	html += '</head><body>';

	// Include template
	html += '<div id="main">';
	var tplf = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'web/views/'+args.name+'.tpl');
	if (tplf.exists()) {
		$ui.tpl = _.template(tplf.read().text);
		html += $ui.tpl(args.webdata);
	} else {
		Ti.API.warn("WebAlloy: no view found ["+args.name+"]");
	}
	tplf = null;
	html += '</div>';

	// Include libs
	_.each(libDir, function(js) {
		html += embedJS(js);
	});

	// Include footer
	html += embedJS('web/app.jslocal');
	html += embedJS('web/controllers/'+args.name+'.jslocal');
	html += '</body></html>';

	$ui.html = html;

	$ui._ = function(js) {
		return $ui.evalJS(js);
	};

	$ui.call = function() {
		var args = _.map(Array.prototype.slice.call(arguments, 1), function(a) { return JSON.stringify(a); });
		return $ui._( arguments[0] + '(' + args.join(',') + ')' );
	};

	$ui.$ = function(selector) {
		return {
			call: function() {
				var args = _.map(Array.prototype.slice.call(arguments, 1), function(a) { return JSON.stringify(a); });
				return $ui._( 'document.querySelector("' + selector + '").' + arguments[0] + '(' + args.join(',') + ')' );
			},
			get: function(name) {
				return $ui._( 'document.querySelector("' + selector + '").' + name );
			},
			set: function(name, value) {
				return $ui._( 'document.querySelector("' + selector + '").' + name + ' = ' + JSON.stringify(value) );
			}
		};
	};

	$ui.render = function(data) {
		$ui.$('#main').set('innerHTML', $ui.tpl(data));
	};

	return $ui;
};


(function init() {

	_.each(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'web/lib').getDirectoryListing(), function(js) {
		libDir.push('web/lib/'+js);
	});

})();