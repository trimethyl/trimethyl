/**
 * @class  	WebAlloy
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.jsExt=".jslocal"] The extension to use for Javascript files
 */
exports.config = _.extend({
	jsExt: '.jslocal'
}, Alloy.CFG.T ? Alloy.CFG.T.weballoy : {});

var libDir = [];
var helpers = {};

function embedText(f) {
	var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, f);
	if (file.exists() === false) {
		Ti.API.warn('Weballoy: File not found (' + f + ')');
		return '';
	}

	var read = file.read().text;
	file = null;
	return read;
}

function embedCSS(f) {
	return '<style type="text/css">' + embedText(f) + '</style>';
}

function embedJS(f) {
	return '<script type="text/javascript">' + embedText(f) + '</script>';
}

function getHTML(args) {
	// Include head (styles)
	var html = '<!DOCTYPE html><html><head><meta charset="utf-8" />';
	html += '<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no;" />';

	// Install the global event handler for this specific WebView
	html += '\<script>\
	WebAlloy = {\
		run: function(name, data) {\
			Ti.App.fireEvent("__weballoy' + args.uniqid + '", { name: name, data: data });\
		}\
	};\
	</script>';

	// Include global css
	html += embedCSS('web/app.css');
	html += embedCSS('web/styles/' + args.name + '.css');

	html += '</head><body>';


	// Include template
	$ui.tpl = _.template(embedText('web/views/' + args.name + '.tpl'));

	html += '<div id="main">';
	html += $ui.tpl(_.extend({}, helpers, args.webdata));
	html += '</div>';

	// Include libs
	_.each(libDir, function(js) {
		html += embedJS(js);
	});

	// Include footer
	html += embedJS('web/app' + exports.config.jsExt);
	html += embedJS('web/controllers/' + args.name + exports.config.jsExt);

	html += '</body></html>';

	return html;
}

/**
 * Add an helper for the WebView
 * @param {String} 		name   The name of the helper
 * @param {Function} 	method The callback
 */
exports.addHelper = function(name, method) {
	helpers[name] = method;
};

/**
 * @method createView
 * @param  {Object} args Arguments for the view.
 * @return {Ti.UI.WebView}
 */
exports.createView = function(args) {
	args = args || {};
	if (_.isEmpty(args.name)) {
		throw new Error('WebAlloy: you must pass a name');
	}

	args.uniqid = _.uniqueId();
	var $ui = Ti.UI.createWebView(_.extend({
		disableBounce: true,
		uniqid: args.uniqid,
		enableZoomControls: false,
		backgroundColor: 'transparent'
	}, args));

	$ui.addEventListener('load', function(){
		if (args.autoHeight === true) {
			$ui.height = $ui.evalJS('document.body.clientHeight');
		}
		if (_.isFunction(args.loaded)) args.loaded();
	});

	$ui.html = getHTML(args);

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
		$ui.$('#main').set('innerHTML', $ui.tpl(_.extend({}, helpers, data)));
	};


	// Install the API listener
	if (args.webapi != null) {

		var webapiListener = function(event) {
			if (!_.isFunction(args.webapi[event.name])) return;
			args.webapi[event.name].call($ui, event.data);
		};

		Ti.App.addEventListener('__weballoy' + args.uniqid, webapiListener);
		$ui.webapiUnbind = function() {
			Ti.App.removeEventListener('weballoy_' + args.uniqid, webapiListener);
		};
	}

	return $ui;
};


/*
Init
*/

var jsFiles = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'web/lib').getDirectoryListing();
_.each(jsFiles, function(js) {
	libDir.push('web/lib/'+js);
});
