/*

XP.UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/


function simpleHTMLParser(text) {
	/*
	Thanks to @lastguest
	https://gist.github.com/lastguest/10277461
	*/
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
		this.windows = [];
	};

	NavigationWindow.prototype.open = function(args) {
		return this.openWindow(this.args.window, args);
	};

	NavigationWindow.prototype.close = function(callback) {
		if (callback) this.closeCallback = callback;

		if (this.windows.length>0) {
			var w = this.windows.pop();
			w.navigationIndex = null;
			w.popToRoot = true;
			w.close({ animated: false });
		} else {
			if (this.closeCallback) this.closeCallback();
			this.closeCallback = null;
		}
	};

	NavigationWindow.prototype.openWindow = function(window, args) {
		var self = this;
		args = args || {};

		if (OS_ANDROID) {

			if (args.animated!==false) {
				if (args.modal) {
					args.activityEnterAnimation = Ti.Android.R.anim.fade_in;
					args.activityExitAnimation = Ti.Android.R.anim.fade_out;
				} else {
					args.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
					args.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
				}
			}

			window.addEventListener('close', function(e){
				if (e.source.navigationIndex>=0) {
					self.windows.splice(e.source.navigationWindow, 1);
				}
				if (e.source.popToRoot) {
					self.close();
				}
			});

			if (window.rightNavButton && window.rightNavButton.children[0]) {
				while (window.rightNavButton.children[0]) {
					window.rightNavButton = window.rightNavButton.children[0];
				}

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

		window.navigationIndex = this.windows.length;
		this.windows.push(window);

		return window.open(_.extend(args, { modal: false }));
	};

	NavigationWindow.prototype.closeWindow = function(window) {
		return window.close();
	};

	NavigationWindow.prototype.getWindowsStack = function() {
		return this.windows;
	};

}

exports.createNavigationWindow = function(args) {
	if (OS_IOS) {
		return Ti.UI.iOS.createNavigationWindow(args);
	}

	return new NavigationWindow(args);
};

exports.createWindow = function(args) {
	return Ti.UI.createWindow(args);
};

function __onTextAreaFocus(e) {
	var $this = e.source || e;
	if ($this.hintText==$this.value) {
		$this.applyProperties({
			value: '',
			color: $this.__color
		});
	}
}

function __onTextAreaBlur(e) {
	var $this = e.source || e;
	if (!$this.value) {
		$this.applyProperties({
			value: $this.hintText,
			color: $this.hintTextColor
		});
	}
}

exports.createTextArea = function(args) {
	var $this = Ti.UI.createTextArea(args);

	if (OS_IOS) {
		$this.__color = $this.color || '#000';
		if (!$this.hintTextColor) $this.hintTextColor = '#ccc';

		$this.addEventListener('focus', __onTextAreaFocus);
		$this.addEventListener('blur', __onTextAreaBlur);
		__onTextAreaBlur($this);
	}

	return $this;
};

exports.createLabel = function(args) {
	var $this = Ti.UI.createLabel(args);

	if (OS_IOS) {

		$this.setHtml = function(value) {
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

			var parseResult = simpleHTMLParser(value.replace(/<br\/?>/g, "\n").replace(/<p>/g, '').replace(/<\/p>/g, "\n\n"));
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

			$this.attributedString = Ti.UI.iOS.createAttributedString(attributedString);
		};

		if ($this.html) {
			$this.setHtml($this.html);
		}
	}

	return $this;
};

exports.createTableView = function(args) {
	if (args.animateRows) {
		args.__data = args.data;
		delete args.data;
	}

	var $ui = Ti.UI.createTableView(args || {});

	if (args.animateRows) {
		_.each(args.__data, function(row, i){
			setTimeout(function(){
				$ui.appendRow(row, {
					animated: true,
					animationStyle: Ti.UI.iPhone.RowAnimationStyle[i%2===0?'LEFT':'RIGHT']
				});
			}, i*100);
		});
	}

	return $ui;
};