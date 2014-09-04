/**
 * @class  XPUI
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide XP UI elements to handle differences between platforms
 *
 * Inspired to FokkeZB UTIL, thanks!
 *
 * You can use in Alloy XML Views with `module="xp.ui"`
 *
 * All new methods can be called automatically on UI-creation with its relative property.
 *
 * For example, if a module expose the method `setFooProperty`, you can assign
 * on creation using:
 *
 * ```
 * var me = T('xp.ui').createBar({ fooProperty: 'a' })
 * ```
 *
 * **DON'T** use the `me.fooProperty = [NEW VALUE]` syntax to assign the property, use `setFooProperty` instead.
 *
 * **DON'T** use the `me.fooProperty` syntax to get the value, use `getFooProperty` instead.
 *
 */


if (!OS_IOS) {

	var NavigationWindow = function NavigationWindow(args) {
		args = args || {};
		var self = this;

		self.windows = [];
		self.window = args.window || null;

		function onWindowClose(e) {
			var window = e.source;
			if (_.isNumber(window.navigationIndex)) {
				self.windows.splice(window.navigationWindow, 1);
				self.window = _.last(self.windows);
			}
		}

		self.open = function open(opt) {
			if (!args.window) {
				Ti.API.error("XP.UI: no window defined in NavigationWindow");
				return false;
			}

			self.openWindow(args.window, opt);
		};

		self.close = function close(callback) {
			function _close(cb) {
				if (self.windows.length===0) {
					if (_.isFunction(callback)) callback();
					return;
				}

				var w = self.windows.pop();
				w.removeEventListener('close', onWindowClose);
				w.addEventListener('close', _close);
				w.close({ animated: false });
			}

			_close();
		};

		self.openWindow = function openWindow(window, opt) {
			opt = opt || {};

			if (OS_ANDROID) {
				if (opt.animated!==false) {
					if (opt.modal) {
						opt.activityEnterAnimation = Ti.Android.R.anim.fade_in;
						opt.activityExitAnimation = Ti.Android.R.anim.fade_out;
					} else {
						opt.activityEnterAnimation = Ti.Android.R.anim.slide_in_left;
						opt.activityExitAnimation = Ti.Android.R.anim.slide_out_right;
					}
					opt.modal = false; // set anyway to false to prevent heavyweight windows
				}
			}

			window.navigationIndex = +self.windows.length;
			window.addEventListener('close', onWindowClose);

			self.windows.push(window);
			self.window = window; // expose property

			window.open(opt);
		};

		self.closeWindow = function closeWindow(window) {
			window.close();
		};

		self.getWindowsStack = function getWindowsStack() {
			return self.windows;
		};

		return self;
	};

}

/**
 * @method  createNavigationWindow
 * @param  {Object} args [description]
 */
exports.createNavigationWindow = function(args) {
	args = args || {};

	if (OS_IOS) {
		return Ti.UI.iOS.createNavigationWindow(args);
	}

	return new NavigationWindow(args);
};



/**
 * @method createWindow
 *
 * ## New methods
 *
 * `setDeferredBackgroundImage(String)`
 *
 * When large images are requested, it's useful to set `deferredBackgroundImage` to set the background on window open.
 *
 * `setBackgroundCoverImage(String)`
 *
 * Titanium doesn't have `backgroundSize: cover` property. This is a workaround to make it work it!
 *
 * `addActivityButton(Dict)` (OS_ANDROID)
 *
 * Add an activity right button
 *
 * `setActivityButton(Dict)` (OS_ANDROID)
 *
 * Set an activity right button and remove all others
 *
 * `setRightNavButton(Dict)` (OS_ANDROID)
 *
 * Alias for `setActivityButton`
 *
 * `setActionBarProperties(Dict)` (OS_ANDROID)
 *
 * Set the properties for the actionBar
 *
 * `setActivityProperties(Dict)` (OS_ANDROID)
 *
 * Set the properties for the activity
 *
 * `setDisplayHomeAsUp(Boolean)` (OS_ANDROID)
 *
 * Set the property displayHomeAsUp and the relative close listener
 *
 * ## Android improvements
 *
 * The properties `title` and `subtitle` automatically set the title and subtitle in the ActionBar.
 *
 * @param  {Object} args
 */
exports.createWindow = function(args) {
	args = args || {};
	var $this = Ti.UI.createWindow(args);

	var opened = false;

	var onOpenFuncs = [], onOpen = function(fun) {
		if (opened) { fun(); return; }
		onOpenFuncs.push(fun);
	};

	$this.addEventListener('open', function() {
		opened = true;
		_.each(onOpenFuncs, function(f){ f(); });
	});


	// DeferredBackgroundImage
	// ===================================

	$this.setDeferredBackgroundImage = function(val) {
		onOpen(function() {
			$this.backgroundImage = val;
		});
	};


	// BackgroundCoverImage
	// ===================================

	var bgCoverUI = null, bgCoverUISview = null;
	$this.setBackgroundCoverImage = function(val){
		var SCREEN_RATIO = Alloy.Globals.SCREEN_WIDTH/Alloy.Globals.SCREEN_HEIGHT;

		if (null===bgCoverUI) {
			bgCoverUI = Ti.UI.createImageView();

			// Wait for postlayout to determine where to stretch
			bgCoverUI.addEventListener('postlayout', function(e){
				if (bgCoverUI.postlayouted) return;
				bgCoverUI.postlayouted = true;

				var R = bgCoverUI.size.width/bgCoverUI.size.height;
				bgCoverUI.applyProperties(
					SCREEN_RATIO>R ?
					{ width: Alloy.Globals.SCREEN_WIDTH, height: Ti.UI.SIZE } :
					{ width: Ti.UI.SIZE, height: Alloy.Globals.SCREEN_HEIGHT }
				);
			});

			bgCoverUISview = Ti.UI.createScrollView({
				touchEnabled: false,
				width: Alloy.Globals.SCREEN_WIDTH,
				height: Alloy.Globals.SCREEN_HEIGHT,
				zIndex: -1
			});
			bgCoverUISview.add(bgCoverUI);

			$this.add(bgCoverUISview);
		}

		bgCoverUI.postlayouted = false;
 		bgCoverUI.setImage(val);
	};

	if (OS_ANDROID) {

		// Activity
		// ====================================

		$this.setActivityProperties = function(props, callback) {
			onOpen(function(){
				if (!$this.activity) return;
				_.each(props, function(v,k) { $this.activity[k] = v; });
				if (_.isFunction(callback)) callback($this.activity);
			});
		};

		// ActionBar
		// ====================================

		$this.setActionBarProperties = function(props, callback) {
			onOpen(function(){
				if (!$this.activity.actionBar) return;
				_.each(props, function(v,k) { $this.activity.actionBar[k] = v; });
				if (_.isFunction(callback)) callback($this.activity.actionBar);
			});
		};

		// DisplayHomeAsUp
		// ====================================

		var displayHomeAsUp = false;

		$this.setDisplayHomeAsUp = function(value) {
			displayHomeAsUp = value;
			$this.setActionBarProperties({ displayHomeAsUp: displayHomeAsUp });
		};

		$this.setActionBarProperties({
			onHomeIconItemSelected: function() {
				if (!displayHomeAsUp) return;
				$this.close();
			}
		});


		// ActivityButton
		// ====================================

		var activityButtons = [];

		$this.addActivityButton = function(opt){
			while (opt.children && opt.children[0]) opt = opt.children[0];// hack for Alloy, just ignore it

			if (!opt.title && !opt.image) {
				Ti.API.error("XP.UI: please specify a title OR icon/image for ActivityButton");
				return;
			}

			activityButtons.push(opt);
		};

		$this.setActivityProperties({
			onCreateOptionsMenu: function(e){
				_.each(activityButtons, function(btn){
					var menuItem = e.menu.add({
						title: btn.title || '',
						icon: btn.icon || btn.image || '',
						showAsAction: btn.showAsAction || Ti.Android.SHOW_AS_ACTION_ALWAYS
					});
					menuItem.addEventListener('click', function(){
						if (_.isFunction(btn.click)) btn.click();
						if (_.isFunction(btn.fireEvent)) btn.fireEvent('click');
					});
				});
			}
		}, function(act) {
			if (act.invalidateOptionsMenu) act.invalidateOptionsMenu();
		});

		$this.setActivityButton = function(opt) {
			activityButtons = [];
			$this.addActivityButton(opt);
		};


 		// RightNavButton (just an alias)
 		// ======================================

		$this.setRightNavButton = $this.setActivityButton;

	}


	// ==================================
	// PARSE ARGUMENTS AND INITIALIZATION
	// ==================================

	if (args.deferredBackgroundImage) $this.setDeferredBackgroundImage(args.deferredBackgroundImage);
	if (args.backgroundCoverImage) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	if (OS_ANDROID) {

		var bar = {};
		if (args.subtitle) {
			bar.title = args.title;
			bar.subtitle = args.subtitle;
		} else {
			if (args.subtitle===false) bar.title = args.title;
			else {
				bar.title =  Ti.App.name;
				bar.subtitle = args.title;
			}
		}
		$this.setActionBarProperties(bar);

		if (args.activityProperties) $this.setActivityProperties(args.activityProperties);
		if (args.actionBarProperties) $this.setActionBarProperties(args.actionBarProperties);

		if (args.rightNavButton) $this.setRightNavButton(args.rightNavButton);
		if (args.activityButtons) _.each(args.activityButtons, function(val) { $this.addActivityButton(val); });
		if (args.activityButton) $this.setActivityButton(args.activityButton);
		if (args.displayHomeAsUp) $this.setDisplayHomeAsUp(args.displayHomeAsUp);

	}

	return $this;
};



/**
 * @method  createTextField
 *
 * ## Creation properties
 *
 * `textType`
 *
 * Can be *email* or *password*, and adjust the keyboard or the mask automatically.
 *
 * ## Android Fixes
 *
 * Removed the annoying autofocus on Android.
 *
 * @param  {Object} args
 * @return {Ti.UI.TextField}
 */
exports.createTextField = function(args) {
	args = args || {};

	switch (args.textType) {
		case 'email': args.keyboardType = Ti.UI.KEYBOARD_EMAIL; break;
		case 'password': args.passwordMask = true; break;
		case 'passwordEye': args.passwordMask = true; break;
	}

	var $this = Ti.UI.createTextField(args);


	// PasswordEye
	// ===============================

	if (OS_IOS && args.textType=='passwordEye') {
		var eyeButton = Ti.UI.createButton({
			image: '/images/T/eye.png',
			height: 40, width: 40,
			opacity: 0.2,
			active: false,
			tintColor: $this.color
		});
		$this.setRightButton(eyeButton);
		$this.setRightButtonPadding(0);
		$this.setRightButtonMode(Ti.UI.INPUT_BUTTONMODE_ALWAYS);

		eyeButton.addEventListener('click', function(e){
			eyeButton.active = !eyeButton.active;
			eyeButton.opacity = eyeButton.active ? 1 : 0.2;
			$this.setPasswordMask(!eyeButton.active);
		});
	}


	// ==================================
	// PARSE ARGUMENTS AND INITIALIZATION
	// ==================================

	// Remove autofocus

	if (OS_ANDROID) {
		$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS);
		$this.addEventListener('touchstart',  function(e) {
			$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
		});
	}

	return $this;
};


/**
 * @method  createTextArea
 *
 * ## iOS Fixes
 *
 * Add support for `hintText`, that is missing on iOS.
 *
 * ### New methods
 *
 * `getRealValue()`
 *
 * Get the effective value when using hintText hack
 *
 * ## Android Fixes
 *
 * Removed the annoying autofocus.
 *
 * @param  {Object} args
 * @return {Ti.UI.TextArea}
 */
exports.createTextArea = function(args) {
	args = args || {};
	var $this = Ti.UI.createTextArea(args);

	var originalColor = $this.color || '#000';

	var onTextAreaFocus = function() {
		if (!$this.getRealValue().length) {
			$this.applyProperties({ value: '', color: originalColor });
		}
	};

	var onTextAreaBlur = function() {
		if (0===$this.value.length) {
			$this.applyProperties({ value: $this.hintText, color: $this.hintTextColor || '#AAA' });
		} else {
			$this.color = originalColor;
		}
	};

	if (OS_IOS) {

		$this.getRealValue = function getRealValue(){
			if ($this.hintText==$this.value) return '';
			return $this.value;
		};

		$this.getHintText = function getHintText() {
			return $this.hintText;
		};

		$this.setHintText = function setHintText(val) {
			$this.hintText = val;
		};
	}


 	/*
 	==================================
 	PARSE ARGUMENTS AND INITIALIZATION
 	==================================
 	*/

 	if (OS_IOS && args.hintText) {
 		$this.setHintText(args.hintText);
 		$this.addEventListener('focus', onTextAreaFocus);
 		$this.addEventListener('blur', onTextAreaBlur);
 		onTextAreaBlur();
 	}

 	// Remove autofocus

	if (OS_ANDROID) {
		$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS);
		$this.addEventListener('touchstart',  function(e) {
			$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
		});
	}

	return $this;
};




/* Thanks to @lastguest: https://gist.github.com/lastguest/10277461 */
function simpleHTMLParser(text) {
	var tags_rx = /<\s*(\/?\s*[^>]+)(\s+[^>]+)?\s*>/gm, partial, tag, temp_style;
	var last_idx = 0, last_text_idx = 0;
	var style = [], style_stack = [], clean_text = [];

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
 * ## iOS Fixes
 *
 * Add support for **VERY BASIC** HTML.
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
	args = args || {};
	var $this = Ti.UI.createLabel(args);

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

			$this.setAttributedString(Ti.UI.iOS.createAttributedString(attributedString));
		};

	}

	/*
 	==================================
 	PARSE ARGUMENTS AND INITIALIZATION
 	==================================
 	*/

	if (OS_IOS) {
		if (args.html) $this.setHtml(args.html);
	}

	return $this;
};



/**
 * @method createListView
 *
 * ## New listeners
 *
 * `itemdblclick`
 *
 * Similar to itemclick, but for double **item** click
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
 * @param  {Object} args
 */
exports.createTabbedBar = function(args) {
	args = args || {};
	if (OS_IOS) {
		return Ti.UI.iOS.createTabbedBar(args);
	}

	var $this = Ti.UI.createView(args);

	var labels = [];
	var labelIndex = 0;
	var UIWrapLabels = null;

	$this.getLabels = function() {
		return labels;
	};

	$this.setLabels = function(lbls) {
		labels = [];
		_.each(lbls, function(l, i){
			labels.push(_.isObject(l) ? l.title : l);
		});

		var width = Math.floor(100/labels.length)+'%';
		var $wrap = Ti.UI.createView({ layout: 'horizontal' });
		_.each(labels, function(l, i){
			$wrap.add(Ti.UI.createButton({
				title: l,
				index: i,
				width: width, left: 0, right: 0, height: 32,
				borderColor: $this.tintColor || '#000',
				borderWidth: 1,
				font: $this.font || {},
				backgroundColor: 'transparent',
				color: $this.tintColor || '#000'
			}));
		});

		if (null !== UIWrapLabels) $this.remove(UIWrapLabels);
		$this.add($wrap);
		UIWrapLabels = $wrap;
	};

	$this.getIndex = function() {
		return labelIndex;
	};

	$this.setIndex = function(i) {
		if ( ! _.isNumber(i)) {
			Ti.API.error("XP.UI: new index value is not a number");
			return;
		}

		labelIndex = +i;
		_.each(UIWrapLabels && UIWrapLabels.children ? UIWrapLabels.children : [], function($c, i) {
			if (+i==labelIndex) {
				$c.applyProperties({
					backgroundColor: $this.tintColor || '#000',
					color: $this.backgroundColor || '#fff',
					active: false
				});
			} else {
				$c.applyProperties({
					backgroundColor: 'transparent',
					color: $this.tintColor || '#000',
					active: true
				});
			}
		});
	};

	/*
 	==================================
 	PARSE ARGUMENTS AND INITIALIZATION
 	==================================
 	*/

	$this.addEventListener('click', function(e){
		if (void(0)===e.source.index) return;
		$this.setIndex(+e.source.index);
	});

	if (args.labels) $this.setLabels(args.labels);
	$this.setIndex(args.index||0);

	return $this;
};


/**
 * @method createButton
 * @return {Ti.UI.Button}
 */
 exports.createButton = function(args) {
 	args = args || {};
 	var $this = Ti.UI.createButton(args || {});



 	return $this;
 };
