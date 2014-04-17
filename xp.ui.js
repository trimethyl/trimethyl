/*

XP.UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/

/*
Thanks to @lastguest
https://gist.github.com/lastguest/10277461
*/
function simpleHTMLParser(text) {
	var tags_rx = /<\s*(\/?\s*[^>]+)(\s+[^>]+)?\s*>/gm,
	partial,
	tag,
	temp_style;

	var last_idx = 0,
	last_text_idx = 0;

	var style = [],
	style_stack = [],
	clean_text = [];

	while ((tag=tags_rx.exec(text))!==null) {
		partial = text.substr(last_idx, tag.index - last_idx);
		clean_text.push(partial);
		last_text_idx += partial.length;

		if (tag[1][0]=='/'){
			temp_style = style_stack.pop();
			temp_style.length = last_text_idx - temp_style.start;
			style.push(temp_style);
		} else {
			style_stack.push({
				type: tag[1],
				start: last_text_idx,
			});
		}
		last_idx = tags_rx.lastIndex;
	}

	clean_text.push(text.substr(last_idx));

	return {
		text: clean_text.join(''),
		style: style
	};
}

if (OS_ANDROID) {

	var NavigationWindow = function(args) {
		this.args = args;
	};

	NavigationWindow.prototype.open = function(params) {
		return this.openWindow(this.args.window, params || {});
	};

	NavigationWindow.prototype.close = function(params) {
		return this.closeWindow(this.args.window, params || {});
	};

	NavigationWindow.prototype.openWindow = function(window, params) {
		params = params || {};

		if (OS_ANDROID) {

			// Perform animations
			if (params.animated!==false) {
				if (params.modal) {
					params.activityEnterAnimation = Ti.Android.R.anim.fade_in;
					params.activityExitAnimation = Ti.Android.R.anim.fade_out;
				} else {
					params.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
					params.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
				}
			}

			// Auto add the RightNavButton
			if (window.rightNavButton && window.rightNavButton.children[0]) {
				while (window.rightNavButton.children[0])
					window.rightNavButton = window.rightNavButton.children[0];

				window.activity.onCreateOptionsMenu = function(e){
					var menuItem = e.menu.add({
						title: window.rightNavButton.title || 'Button',
						icon: window.rightNavButton.icon || window.rightNavButton.image || '',
						showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
					});
					menuItem.addEventListener('click', function(){
						window.rightNavButton.fireEvent('click');
					});
				};
			}

		}

		return window.open(_.extend(params, { modal:false }));
	};

	NavigationWindow.prototype.closeWindow = function(window, params) {
		return window.close(params || {});
	};
}

exports.createNavigationWindow = function(args) {
	return OS_IOS ? Ti.UI.iOS.createNavigationWindow(args) : new NavigationWindow(args);
};

exports.createWindow = function(args) {
	return OS_IOS ? Ti.UI.createWindow(args) : Ti.UI.createView(args);
};

function __onTextAreaFocus(e) {
	if (e.source.hintText==e.source.value) {
		e.source.applyProperties({
			value: '',
			color: e.source.originalColor
		});
	}
}

function __onTextAreaBlur(e) {
	if (!e.source.value) {
		e.source.applyProperties({
			value: e.source.hintText,
			color: '#ccc'
		});
	}
}

exports.createTextArea = function(args) {
	var $ui = Ti.UI.createTextArea(args);

	if (OS_IOS && args.hintText) {
		$ui.originalColor = $ui.color || '#000';
		if (!$ui.value) {
			$ui.applyProperties({
				value: $ui.hintText,
				color: '#aaa'
			});
		}
		$ui.addEventListener('focus', __onTextAreaFocus);
		$ui.addEventListener('blur', __onTextAreaBlur);
	}

	return $ui;
};

exports.createLabel = function(args) {
	if (!OS_IOS) {
		return Ti.UI.createLabel(args);
	}

	var $ui = Ti.UI.createLabel(args);

	$ui.setHtml = $ui.setHTML = function(html){
		html = html.replace(/<br\/?>/g, "\n");
		html = html.replace(/<p>/g, '').replace(/<\/p>/g, "\n\n");

		var htmlToAttrMap = {
			'u': {
				type: Ti.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE,
				value: Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
			},
			'i': {
				type: Ti.UI.iOS.ATTRIBUTE_FONT,
				value: /-Regular/.test(args.font.fontFamily) ?
				{ fontFamily: args.font.fontFamily.replace('-Regular', '-Italic'), fontSize: args.font.fontSize } :
				{ fontFamily: args.font.fontFamily, fontSize: args.font.fontSize, fontStyle: 'Italic' }
			},
			'b': {
				type: Ti.UI.iOS.ATTRIBUTE_FONT,
				value: /-Regular/.test(args.font.fontFamily) ?
				{ fontFamily: args.font.fontFamily.replace('-Regular', '-Bold'), fontSize: args.font.fontSize } :
				{ fontFamily: args.font.fontFamily, fontSize: args.font.fontSize, fontWeight: 'Bold' }
			}
		};

		var parseResult = simpleHTMLParser(html);
		var attributedString = {
			text: parseResult.text,
			attributes: []
		};

		_.each(parseResult.style, function(v){
			if (v.type in htmlToAttrMap) {
				attributedString.attributes.push(_.extend(_.clone(htmlToAttrMap[v.type]), {
					range: [ v.start, v.length ]
				}));
			}
		});

		$ui.attributedString = Ti.UI.iOS.createAttributedString(attributedString);
	};

	if (args.html) {
		$ui.setHTML(args.html);
	}

	return $ui;
};