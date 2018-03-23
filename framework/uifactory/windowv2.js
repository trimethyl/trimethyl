/**
 * @module  uifactory/windowv2
 * @author  Flavio De Stefano <flavio.destefano@caffeina.com>
 * @author  Flavio De Stefano <andrea.jonus@caffeina.com>
 */

var UIUtil = require("T/uiutil");

var LOGNAME = "UIFactory/Window";
var MENUITEM_PROPS = [
    "actionView",
    "enabled",
    "groupId",
    "itemId",
    "order",
    "showAsAction",
    "titleCondensed",
    "visible"
];

module.exports = function(args) {
	_.defaults(args, {
		/**
		 * **(Android only)** Set the property `displayHomeAsUp` and the relative close listener.
		 * @property {Boolean} [displayHomeAsUp=false]
		 */
		displayHomeAsUp: false,

		/**
		 * **(Android only)** Disable the hardware back button (do nothing on click)
		 * @property {Boolean} [backButtonDisabled=false]
		 */
		backButtonDisabled: false,

		/**
		 * View {@link #setDeferredBackgroundImage}
		 * @property {String} [deferredBackgroundImage=null]
		 */
		deferredBackgroundImage: null,

		/**
		 * View {@link #setBackgroundCoverImage}
		 * @property {String} [backgroundCoverImage=null]
		 */
		backgroundCoverImage: null,

		/**
		 * View {@link #setActivityProperties}
		 * @property {Object} [activityProperties=null]
		 */
		activityProperties: null,

		/**
		 * View {@link #setActionBarProperties}
		 * @property {Object} [actionBarProperties=null]
		 */
		actionBarProperties: null,

		/**
		 * @property {Object} [rightNavButton=null]
		 * View {@link #setRightNavButton}
		 */
		rightNavButton: null,

		/**
		 * @property {Object} [rightNavButtons=null]
		 * View {@link #setRightNavButtons}
		 */
		rightNavButtons: [],

		/**
		 * @property {Object} [titleControl=null]
		 * View {@link #setTitleControl}
		 */
		titleControl: null,

		/**
		 * **Android specific**
		 * Set an handler that kills the entire app when the back button is pressed
		 * @property {Boolean} [exitOnBack=null]
		 */
        exitOnBack: null
        
        /**
         * **Android specific**
         * The list of the current menu items for this activity, in order of insertion.
         * You can modify the values of these items, but you shouldn't modify the list itself. Use "setRightNavButtons()" to do so.
         * @readonly
         * @property {Ti.Android.MenuItem[]} [menuItems=[]]
         */
	});

	var $this = Ti.UI.createWindow(args);

	$this.opened = false;
	var onOpenFuncs = [];
	function onOpen(callback) {
		if ($this.opened === true) {
			callback();
			return;
		}
		onOpenFuncs.push(callback);
	}

	$this.addEventListener("open", function() {
		$this.opened = true;
		_.each(onOpenFuncs, function(openFunc) {
			openFunc();
		});
	});

	/**
	 * When large images are requested, it's useful to set `deferredBackgroundImage` to set the background on window open.
	 * @method setDeferredBackgroundImage
	 * @param {String} val
	 */
	$this.setDeferredBackgroundImage = function(val) {
		onOpen(function() {
			$this.backgroundImage = val;
		});
	};

	/**
	 * @method  setBackgroundCoverImage
	 * @param {String} url
	 */
	$this.setBackgroundCoverImage = function(url) {
		UIUtil.setBackgroundCoverForView($this, url, function(file) {
			$this.backgroundImage = file;
		});
	};

	/**
	 * Fade in this window
	 * @method  fadeIn
	 */
	$this.fadeIn = function() {
		$this.opacity = 0;
		$this.open();
		$this.animate({
			opacity: 1,
			duration: 300
		});
	};

	/**
	 * Fade in this window
	 * @method  fadeOut
	 */
	$this.fadeOut = function() {
		$this.animate(
			{
				opacity: 0,
				duration: 300
			},
			function() {
				$this.close();
			}
		);
	};

	/**
	 * @method getRightNavButtonAt
	 * @param {Number} index
	 * @returns {(Ti.UI.View|Ti.Android.MenuItem|null)} The right nav item at the given position. It returns null if the index is out of bounds.
	 */
	$this.getRightNavButtonAt = function(index) {
		// TODO
	};

	if (OS_ANDROID) {
		/**
		 * **Android specific**
		 * Set the properties for the Activity
		 * @method setActivityProperties
		 * @param {Object} props
		 */
		$this.setActivityProperties = function(props) {
			_.each(props, function(v, k) {
				$this.activity[k] = v;
			});
		};

		/**
		 * **Android specific**
		 * Set the properties for the ActionBar
		 * @method  setActionBarProperties
		 * @param {Object}   props
		 * @param {Function} callback
		 */
		$this.setActionBarProperties = function(props, callback) {
			onOpen(function() {
				if ($this.activity.actionBar == null) return;

				_.each(props, function(v, k) {
					$this.activity.actionBar[k] = v;
				});
				if (_.isFunction(callback)) callback($this.activity.actionBar);
			});
		};

		/**
		 * Add custom content to the nav bar. On iOS, it uses the attribute `Ti.UI.Window.titleControl`. On Android, it uses `Ti.UI.Toolbar` to replicate the behaviour of titleControl.
		 * **iOS**: Check the official documentation for [Ti.UI.Window.titleControl](https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.Window-property-titleControl).
		 * **Android**: Check the official documentation for [Ti.UI.Toolbar](https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.Toolbar).
		 * @method setTitleControl
		 * @param {(Ti.UI.View)} view The view to show in the nav bar. On Android, the children of this view will be added to the Toolbar.
		 */
		$this.setTitleControl = function(view, opt) {
			if (view == null) return;

			// TODO take the attributes of the window in consideration
			var toolbar = Ti.UI.createToolbar(
				_.extend({}, opt, {
					items: view.children || []
				})
			);

			$this.titleControl = view;

			function setToolbar() {
				$this.activity.setSupportActionBar(toolbar);
			}

			onOpen(setToolbar);
		};

		/**
		 * @method getTitleControl
		 * @returns {(Ti.UI.View)} The view used in the title control. Returns `null` if the "titleControl" attribute hasn't been set.
		 */
		$this.getTitleControl = function() {
			return $this.titleControl;
		};

		/**
		 * @method setRightNavButton
		 * @param {(Ti.UI.View|Object)} item The item to set in the right navigation area.
		 */
		$this.setRightNavButton = function(item) {
			// TODO check the effect of setRightNavButton() on rightNavButtons on iOS
			// $this.rightNavButton = item;
			// $this.setRightNavButtons(item != null ? [item] : []);
		};

		/**
		 * @method getRightNavButton
		 * @returns {(Ti.UI.View|Ti.Android.MenuItem)} The right nav item. If there are more than one, it returns the first. If there are no right nav items, it returns null.
		 */
		$this.getRightNavButton = function() {
			// TODO check the effect of setRightNavButton() on rightNavButtons on iOS
			// if ($this.rightNavButton != null) {
			//     return $this.rightNavButton;
			// }
		};

		/**
		 * Set the given items (or views) as right nav buttons. On Android, these items are converted to "Ti.Android.MenuItem".
		 * @method setRightNavButtons
		 * @param {(Ti.UI.View[]|Object[])} items The items to set in the right navigation area.
		 */
		$this.setRightNavButtons = function(items) {
			// TODO what happens if I pass `null` to setRightNavButtons() on iOS? What if I set rightNavButtons to null?
			$this.rightNavButtons = items;

			// Invalidate the options menu, so that "Window.activity.onCreateOptionsMenu()" gets called
			onOpen(function() {
				$this.activity.invalidateOptionsMenu();
			});
		};

		/**
		 * @method getRightNavButtons
		 * @returns {(Ti.UI.View[]|Ti.Android.MenuItem[])} The right nav items. It returns an empty array if there are no items.
		 */
		$this.getRightNavButtons = function() {
			return $this.rightNavButtons;
		};

		/**
		 * **Android specific**
		 * Auto-process the titles.
		 * @method  processTitles
		 */
		$this.processTitles = function() {
			$this.setActionBarProperties({
				title:
					$this.title && $this.subtitle
						? $this.title
						: $this.subtitle === false ? $this.title : Ti.App.name,
				subtitle:
					$this.title && $this.subtitle
						? $this.subtitle
						: $this.subtitle === false ? null : $this.title || null
			});
		};

		/**
		 * **Android fix**
		 * @method setTitle
		 * @param {String} value
		 */
		$this.setTitle = function(value) {
			$this.title = value;
			$this.processTitles();
		};

		/**
		 * **Android fix**
		 * @method  setSubtitle
		 * @param {String} value
		 */
		$this.setSubtitle = function(value) {
			$this.subtitle = value;
			$this.processTitles();
		};

		$this.setActivityProperties({
			onCreateOptionsMenu: function(e) {
                $this.menuItems = [];

				_.each($this.rightNavButtons, function(item) {
					// On iOS, the root element in a RightNavButton is a View. Get the innermost child of that view.
					if ((item.apiName = "Ti.UI.View")) {
						while (item && item.children && item.children[0]) {
							item = item.children[0];
						}
					}

					var menuItem = e.menu.add(
						_.extend(_.pick(item, MENUITEM_PROPS), {
							icon: item.icon || item.image,
							title: item.title || item.text
						})
					);

					menuItem.addEventListener("click", function(e) {
						if (_.isFunction(item.click)) item.click(e);
						if (_.isFunction($this[item.click]))
							$this[item.click](e);
						if (_.isFunction(item.fireEvent))
							item.fireEvent("click", e);
					});

					$this.menuItems.push(menuItem);
				});
			}
		});
	}

	//////////////////////
	// Parse arguments //
	//////////////////////

	if (OS_ANDROID) {
		// Set the window's action bar
		onOpen(function() {
			if ($this.activity != null && $this.activity.actionBar != null) {
				$this.actionBar = $this.activity.actionBar;
			}
		});

		$this.processTitles();
		if (_.isFunction($this.activity.invalidateOptionsMenu)) {
			$this.activity.invalidateOptionsMenu();
		}

		if (args.displayHomeAsUp === true && args.exitOnClose !== true) {
			onOpen(function() {
				// Get the real actionbar from the activity
				if ($this.activity.actionBar == null) return;

				$this.activity.actionBar.displayHomeAsUp = true;
				$this.activity.actionBar.onHomeIconItemSelected = function() {
					$this.close();
				};
			});
		}

		if (args.backButtonDisabled === true) {
			$this.addEventListener("androidback", function() {
				return false;
			});
		}

		if (args.exitOnBack === true) {
			$this.addEventListener("androidback", function() {
				$this.exitOnClose = true; // Set exitOnClose to true, since every window is an activity
				Ti.Android.currentActivity.finish();
			});
		}

		$this.menuItems = [];
		$this.rightNavButtons = null;
		$this.titleControl = null;

		$this.setActivityProperties(args.activityProperties);
		$this.setActionBarProperties(args.actionBarProperties);
		$this.setRightNavButtons(args.rightNavButtons);
		$this.setRightNavButton(args.rightNavButton);
	}

	$this.setDeferredBackgroundImage(args.deferredBackgroundImage);
	$this.setBackgroundCoverImage(args.backgroundCoverImage);
	$this.setTitleControl(args.titleControl);

	return $this;
};
