/**
 * @module  weballoy
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
var fonts = [];

var TMP_DIR = Ti.Filesystem.tempDirectory + '/weballoy';

function embedFile(f) {
	if (_.isEmpty(f)) return null;

	var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, f);
	if ( ! file.exists()) return null;

	return file;
}

function getFileText(f) {
	var file = embedFile(f);
	if (file == null) return '';
	return file.read().text;
}

function embedCSS(f) {
	var file = embedFile(f);
	if (file == null) return '';
	return '<link rel="stylesheet" href="' + file.nativePath + (ENV_DEVELOPMENT ? '?v='+Math.random() : '') + '" />';
}

function embedJS(f) {
	var file = embedFile(f);
	if (file == null) return '';
	return '<script src="' + file.nativePath + (ENV_DEVELOPMENT ? '?v='+Math.random() : '') + '"></script>';
}

function embedFont(f) {
	var file = embedFile(f.src);
	if (file == null) return '';
	return '<style>@font-face { font-family: "' + f.name + '"; font-weight: ' + f.weight + '; src: url("' + f.src + '"); }</style>';
}

function getHTML(opt) {
	var tpl_data = _.extend({}, helpers, opt.webdata);

	// Include head (styles)
	var html = '<!DOCTYPE html><html><head><meta charset="utf-8" />';
	html += '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />';
	html += '<style>body{-webkit-text-size-adjust:none;}</style>'; //iOS auto expand font BUG

	// Install the global event handler for this specific WebView
	html += '<script>window.WebAlloy={run:function(name,data){Ti.App.fireEvent("__weballoy_'+opt.uniqid+'",{name:name,data:data});}};</script>';

	// Include fonts
	_.each(fonts, function(f) {
		html += embedFont(f);
	});

	// Include global css
	html += embedCSS('web/app.css');
	if (opt.name) {
		html += embedCSS('web/styles/' + opt.name + '.css');
	}

	html += '</head><body>';

	html += _.template(getFileText('web/app.tpl'))(tpl_data);

	// Include template
	html += '<div id="main" class="' + (opt.htmlClass || '') + '">';

	if (opt.content) {
		html += _.template(opt.content)(tpl_data);
	} else if (opt.name) {
		html += _.template(getFileText('web/views/' + opt.name + '.tpl'))(tpl_data);
	}

	html += '</div>';

	// Include libs
	_.each(libDir, function(js) {
		html += embedJS(js);
	});

	// Include footer
	html += embedJS('web/app' + exports.config.jsExt);
	if (opt.name) {
		html += embedJS('web/controllers/' + opt.name + exports.config.jsExt);
	}

	html += '</body></html>';

	tpl = null;
	return html;
}

exports.getHTML = getHTML;

/**
 * Add an helper for the WebView
 * The methods `embedCSS` and `embedJS` are automatically exposed
 * @param {String} 		name   The name of the helper
 * @param {Function} 	method The callback
 */
exports.addHelper = function(name, method) {
	helpers[name] = method;
};

/**
 * Add a font dynamically loaded with font-face in CSS
 * @param {String} 		name   		The name of the font
 * @param {String} 		weight 		The weight of the font
 * @param {String}		filename 	The filename of the font (must be located in `app/assets/fonts`)
 */
exports.addFont = function(name, weight, filename) {
	var tiFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'fonts/' + filename);
	if ( ! tiFile.exists()) {
		Ti.API.debug('Weballoy: File not found (' + tiFile.nativePath + ')');
		return false;
	}

	fonts.push({
		name: name,
		weight: weight,
		src: tiFile.nativePath
	});
};

/**
 * @param  {Object} args Arguments for the view.
 * @return {Ti.UI.WebView}
 */
exports.createView = function(args) {
	args = args || {};
	args.uniqid = _.uniqueId();

	var $ui = Ti.UI.createWebView(_.extend({
		disableBounce: true,
		enableZoomControls: false,
		hideLoadIndicator: true,
		scalesPageToFit: false,
		backgroundColor: 'transparent',
		//borderRadius: 0.00001 // If the webview is not rendering set border radius to forse software layer rendering
	}, args));

	if (OS_IOS) {
		$ui.html = getHTML(args);
	} else {
		$ui.addEventListener("postlayout", function render() {
			$ui.removeEventListener("postlayout", render);
			$ui.setHtml(getHTML(args));
		});
	}

	$ui.addEventListener('load', function() {
		if (args.autoHeight) {
			$ui.height = Math.floor( $ui.evalJS('document.documentElement.offsetHeight') );
		}
		if (_.isFunction(args.onLoad)) {
			args.onLoad.call($ui);
		}
	});

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

		Ti.App.addEventListener('__weballoy_' + args.uniqid, webapiListener);
		$ui.webapiUnbind = function() {
			Ti.App.removeEventListener('__weballoy_' + args.uniqid, webapiListener);
		};
	}

	return $ui;
};


/*
Init
*/

var jsFiles = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'web/lib').getDirectoryListing();
_.each(jsFiles, function(js) {
	libDir.push('web/lib/' + js);
});

// Expose those properties in the helpers
helpers.embedCSS = embedCSS;
helpers.embedJS = embedJS;

// Clear
Ti.Filesystem.getFile(TMP_DIR).deleteDirectory(true);
