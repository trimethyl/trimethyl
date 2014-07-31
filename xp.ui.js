/**
 * @class  XPUI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide **CROSS-PLATFORM** UI elements to handle differences between platforms
 *
 * ** non-CommonJS module**
 *
 * You have to use in Alloy with `module="xp.ui"`
 *
 * Inspired to @FokkeZB UTIL. Thanks! :)
 * https://github.com/FokkeZB/UTiL/tree/master/xp.ui
 *
 */


/* ============ NAVIGATIONWINDOW =============== */

if (!OS_IOS) {

	/*
	NavigationWindow Android fallback provided by @FokkeZB
	*/
	var NavigationWindow = function(args) {
		this.args = args || {};
		this.windows = [];
	};

	NavigationWindow.prototype = {

		open: function(args) {
			return this.openWindow(this.args.window, args);
		},

		close: function(callback) {
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
		},

		openWindow: function(window, args) {
			args = args || {};
			var self = this;

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

				if (args.displayHomeAsUp===false) {
					window.addEventListener('open', function() {
						var activity = window.getActivity();
						try {
							if (!activity) return;
							if (!activity.actionBar) return;

							activity.actionBar.displayHomeAsUp = true;
							activity.actionBar.onHomeIconItemSelected = function() {
								self.closeWindow(window);
							};
						} catch (err) {}
					});
				}
			}

			window.addEventListener('close', function(e){
				if (e.source.navigationIndex>=0) {
					self.windows.splice(e.source.navigationWindow, 1);
				}
				if (e.source.popToRoot) self.close();
			});

			window.navigationIndex = this.windows.length;
			this.windows.push(window);

			return window.open(_.extend(args, { modal: false }));
		},

		closeWindow: function(window) {
			return window.close();
		},

		getWindowsStack: function() {
			return this.windows;
		}

	};

}

/**
 * @method  createNavigationWindow
 *
 * ## iOS
 *
 * Nothing done.
 *
 * ## Android
 *
 * Create a **NavigationWindow-compatible** container that handle all windows in a stack.
 *
 * @param  {Object} args [description]
 */
exports.createNavigationWindow = function(args) {
	if (!OS_IOS) {
		return new NavigationWindow(args || {});
	}

	return Ti.UI.iOS.createNavigationWindow(args || {});
};




/* ============ WINDOW ============= */

/**
 * @method createWindow
 *
 * ## iOS
 *
 * Nothing done.
 *
 * ## Android
 *
 * Adds the support for:
 *
 * * **rightNavButton** (partial)
 * * **title and subtitle**: automatically set the title and subtitle in the ActionBar
 *
 * @param  {Object} args
 */
exports.createWindow = function(args) {
	var $ui = Ti.UI.createWindow(args || {});

	if (OS_ANDROID) {

		$ui.addEventListener('open', function(e){
			if (!$ui.activity || !$ui.activity.actionBar) return;

			if ($ui.subtitle) {
				$ui.activity.actionBar.title = $ui.title;
				$ui.activity.actionBar.subtitle = $ui.subtitle;
			} else {
				if ($ui.subtitle===false) {
					$ui.activity.actionBar.title = $ui.title;
				} else {
					$ui.activity.actionBar.title =  Ti.App.name;
					$ui.activity.actionBar.subtitle = $ui.title;
				}
			}
		});

		$ui.setRightNavButton = function($btn){
			if (!$ui.activity) return;

			if ($btn===null) {

				// Clean
				$ui.activity.onCreateOptionsMenu = function(e){
					e.menu.items = [];
				};

			} else {

				while ($btn.children && $btn.children[0]) $btn = $btn.children[0];

				$ui.activity.onCreateOptionsMenu = function(e){
					if (!$btn.title && !$btn.image) {
						Ti.API.error("XP.UI: please specify a title OR icon/image for RightNavButton on Android");
						return;
					}

					var menuItem = e.menu.add({
						title: $btn.title || '',
						icon: $btn.icon || $btn.image || '',
						showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
					});
					menuItem.addEventListener('click', function(){
						$btn.fireEvent('click');
					});
				};
			}

			if ($ui.activity.invalidateOptionsMenu) {
				$ui.activity.invalidateOptionsMenu();
			}
		};


		if (args.rightNavButton) {
			$ui.setRightNavButton(args.rightNavButton);
		} else {
			Ti.API.warn("XP.UI: Starting with Ti-SDK 3.3.0 GA you have to call Window.setRightNavButton(Button) manually on your controller");
		}

	}

	return $ui;
};




/* ========== TEXTAREA =========== */

function __onTextAreaFocus(e) {
	if (!e.source.getRealValue().length) {
		e.source.applyProperties({
			value: '',
			color: e.source.originalColor
		});
	}
}

function __onTextAreaBlur(e) {
	if (!e.source.value.length) {
		e.source.applyProperties({
			value: e.source.__hintText,
			color: e.source.hintTextColor || '#AAA'
		});
	} else {
		e.source.color = e.source.originalColor;
	}
}

function __enableAutoFocus(e) {
	e.source.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS;
}

/**
 * @method  createTextField
 *
 * Added methods:
 *
 * * **getRealValue()**: get the effective value when using hintText hack
 *
 * Added properties:
 *
 * * **textType**: Can be *email* or *password*, and adjust the keyboard or the mask automatically.
 * * **realValue**: get the effective value when using hintText hack
 *
 * ## iOS
 *
 * Nothing done
 *
 * ## Android
 *
 * Removed the annoying autofocus.
 *
 * @param  {Object} args
 * @return {Ti.UI.TextField}
 */
exports.createTextField = function(args) {
	args = args || {};

	switch (args.textType) {
		case 'email':
		args.keyboardType = Ti.UI.KEYBOARD_EMAIL;
		break;
		case 'password':
		args.passwordMask = true;
		break;
	}

	var $this = Ti.UI.createTextField(args);

	if (OS_ANDROID) {
		$this.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
		$this.addEventListener('touchstart', __enableAutoFocus);
	}

	return $this;
};


/**
 * @method  createTextArea
 *
 * Added methods:
 *
 * * **getRealValue()**: get the effective value when using hintText hack
 *
 * Added properties:
 *
 * * **realValue**: get the effective value when using hintText hack
 *
 * ## iOS
 *
 * Adds xp-support for hintText, that is missing on iOS.
 *
 * ## Android
 *
 * Removed the annoying autofocus.
 *
 * @param  {Object} args
 * @return {Ti.UI.TextArea}
 */
exports.createTextArea = function(args) {
	args = args || {};

	var $this = Ti.UI.createTextArea(args || {});

	if (OS_IOS) {
		$this.__hintText = $this.hintText;
		$this.originalColor = $this.color || '#000';
		$this.addEventListener('focus', __onTextAreaFocus);
		$this.addEventListener('blur', __onTextAreaBlur);
		__onTextAreaBlur({ source: $this });
	}

	if (OS_ANDROID) {
		$this.softKeyboardOnFocus = Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS;
		$this.addEventListener('touchstart', __enableAutoFocus);
	}

	// Define a method to get the value when hintText hack is used
	$this.getRealValue = function(){
		if ($this.__hintText==$this.value) return '';
		return $this.value;
	};
	Object.defineProperty($this, 'realValue', { get: $this.getRealValue });

	return $this;
};




/* ============= LABEL ============= */


/* Thanks to @lastguest: https://gist.github.com/lastguest/10277461 */
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


/**
 * @method createLabel
 *
 * ## iOS
 *
 * Add xp-support for **VERY BASIC** HTML.
 *
 * For now, supports `<b><i><u><br><p>` tags.
 *
 * If you specify `fontTransform` property in the arguments,
 * the specified transformation is applied to current font.
 * For example:
 *
 * ```
 * italic: {
 *		fontStyle: 'Italic'
 *	},
 *	bold: {
 *		fontFamily: 'Arial-Bold'
 *	}
 *	```
 *
 * It's useful if you don't have a regular font syntax.
 *
 * @param  {Object} args
 */
exports.createLabel = function(args) {
	var $this = Ti.UI.createLabel(args || {});

	if (OS_IOS) {

		var fontTransform = _.extend({
			italic: {
				fontStyle: 'Italic'
			},
			bold: {
				fontWeight: 'Bold'
			}
		}, args.fontTransform || {});


		$this.setHtml = function(value) {
			var htmlToAttrMap = {
				'u': {
					type: Ti.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE,
					value: Ti.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE
				},
				'i': {
					type: Ti.UI.iOS.ATTRIBUTE_FONT,
					value: _.extend(args.font, fontTransform.italic)
				},
				'b': {
					type: Ti.UI.iOS.ATTRIBUTE_FONT,
					value: _.extend(args.font, fontTransform.bold)
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

		if ($this.html) $this.setHtml($this.html);
	}

	return $this;
};



/**
 * @method createListView
 *
 * Added listeners:
 *
 * * **itemdblclick**: Similar to itemclick, but for double **item** click
 *
 * @param  {Object} args
 */
exports.createListView = function(args) {
	var $this = Ti.UI.createListView(args || {});

	var DBL_CLICK_TIMEOUT = 500;
	var devtClick = {};
	var devtTime = 0;

	$this.addEventListener('itemclick', function(e){
		var evtTime = +(new Date());
		var evtClick = {
			itemId: e.itemId,
			bindId: e.bindId,
			sectionIndex: e.sectionIndex,
			itemIndex: e.itemIndex
		};
		if (evtTime-devtTime<DBL_CLICK_TIMEOUT && _.isEqual(devtClick, evtClick)) {
			evtClick.section = e.section;
			$this.fireEvent('itemdblclick', evtClick);
			evtClick = {}; // prevent non 2n-clicks
		}
		devtTime = evtTime;
		devtClick = evtClick;
	});

	return $this;
};


/**
 * @method createTabbedBar
 *
 * Create a TabbedBar fully compatible with Android
 *
 * @param  {Object} args
 */
exports.createTabbedBar = function(args) {
	args = args || {};
	if (OS_IOS) {
		return Ti.UI.iOS.createTabbedBar(args);
	}

	var $this = Ti.UI.createView(args);

	$this._labels = [];
	$this.getLabels = function() { return $this._labels; };
	$this.setLabels = function(lbls) {
		$this._labels = [];
		_.each(lbls, function(l, i){
			$this._labels.push(_.isObject(l) ? l.title : l);
		});

		var width = Math.floor(100/$this._labels.length)+'%';
		var $wrap = Ti.UI.createView({
			layout: 'horizontal',
		});

		_.each($this._labels, function(l, index){
			$wrap.add(Ti.UI.createButton({
				title: l,
				index: index,
				width: width,
				left: 0,
				right: 0,
				height: 32,
				borderColor: args.tintColor || '#000',
				borderWidth: 1,
				font: args.font || {},
				backgroundColor: 'transparent',
				color: args.tintColor || '#000'
			}));
		});

		if ($this.wrap) $this.remove($this.wrap);
		$this.wrap = $wrap; $this.add($this.wrap);

		if ($this._index) {
			$this.setIndex($this._index);
		}
	};

	Object.defineProperty($this, 'labels', {
		set: $this.setLabels, get: $this.getLabels
	});


	$this._index = 0;
	$this.getIndex = function() { return $this._index; };
	$this.setIndex = function(i) {
		$this._index = +i;

		if (!$this.wrap.children || !$this.wrap.children.length) return;
		_.each($this.wrap.children, function($c, _i) {
			if (_i==$this._index) {
				$c.applyProperties({
					backgroundColor: args.tintColor || '#000',
					color: args.backgroundColor || '#fff',
					active: false
				});
			} else {
				$c.applyProperties({
					backgroundColor: 'transparent',
					color: args.tintColor || '#000',
					active: true
				});
			}
		});
	};

	Object.defineProperty($this, 'index', {
		set: $this.setIndex, get: $this.getIndex
	});

	$this.addEventListener('click', function(e){
		if ('index' in e.source) {
			$this.setIndex(+e.source.index);
		}
	});

	if (args.labels) $this.setLabels(args.labels);
	$this.setIndex(args.index!==undefined ? args.index : 0);

	return $this;
};