/**
 * @class  	UIFactory.Window
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * ## New methods
 *
 * #### `setDeferredBackgroundImage(String)`
 *
 * When large images are requested, it's useful to set `deferredBackgroundImage` to set the background on window open.
 *
 * #### `setBackgroundCoverImage(String)`
 *
 * Titanium doesn't have `backgroundSize: cover` property. This is a workaround to make it work it!
 *
 * #### `addActivityButton(Dict)` (OS_ANDROID)
 *
 * Add an activity right button
 *
 * #### `setActivityButton(Dict)` (OS_ANDROID)
 *
 * Set an activity right button and remove all others
 *
 * #### `setRightNavButton(Dict)` (OS_ANDROID)
 *
 * Alias for `setActivityButton`
 *
 * #### `setActionBarProperties(Dict)` (OS_ANDROID)
 *
 * Set the properties for the actionBar
 *
 * #### `setActivityProperties(Dict)` (OS_ANDROID)
 *
 * Set the properties for the activity
 *
 * #### `setDisplayHomeAsUp(Boolean) `(OS_ANDROID)
 *
 * Set the property `displayHomeAsUp` and the relative close listener
 *
 * ## Android improvements
 *
 * The properties `title` and `subtitle` automatically set the title and subtitle in the ActionBar.
 *
 */

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createWindow(args);

	$this.opened = false;
	var onOpenFuncs = [], onOpen = function(callback) {
		if ($this.opened === true) {
			callback();
			return;
		}
		onOpenFuncs.push(callback);
	};

	$this.addEventListener('open', function() {
		$this.opened = true;
		_.each(onOpenFuncs, function(openFunc){
			openFunc();
		});
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

	var bgCoverUI = null;
	var bgCoverUISview = null;

	$this.setBackgroundCoverImage = function(val){
		var SCREEN_RATIO = require('device').getScreenWidth() / require('device').getScreenHeight();

		if (bgCoverUI === null) {
			bgCoverUI = Ti.UI.createImageView();

			// Wait for postlayout to determine where to stretch
			bgCoverUI.addEventListener('postlayout', function(){
				if (bgCoverUI.postlayouted === true) return;
				bgCoverUI.postlayouted = true;

				var R = bgCoverUI.size.width / bgCoverUI.size.height;
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

		$this.setActivityProperties = function(props) {
			_.each(props, function(v, k) {
				$this.activity[k] = v;
			});
		};

		// ActionBar
		// ====================================

		$this.setActionBarProperties = function(props, callback) {
			onOpen(function(){
				if ($this.activity.actionBar == null) return;

				_.each(props, function(v, k) {
					$this.activity.actionBar[k] = v;
				});
				if (_.isFunction(callback)) callback($this.activity.actionBar);
			});
		};

		// DisplayHomeAsUp
		// ====================================

		var displayHomeAsUp = false;
		$this.setActionBarProperties({
			onHomeIconItemSelected: function() {
				if (displayHomeAsUp === false) return;
				$this.close();
			}
		});

		$this.setDisplayHomeAsUp = function(value) {
			displayHomeAsUp = value;
			$this.setActionBarProperties({
				displayHomeAsUp: displayHomeAsUp
			});
		};


		// ActivityButton
		// ====================================

		var activityButtons = [];

		$this.addActivityButton = function(opt) {
			while (opt.children && opt.children[0]) opt = opt.children[0];// hack for Alloy, just ignore it
			activityButtons.push(opt);
		};

		$this.setActivityProperties({
			onCreateOptionsMenu: function(e) {
				_.each(activityButtons, function(btn) {
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
			if (_.isFunction(act.invalidateOptionsMenu)) act.invalidateOptionsMenu();
		});

		$this.setActivityButton = function(opt) {
			activityButtons = [];
			$this.addActivityButton(opt);
		};


 		// RightNavButton (just an alias)
 		// ======================================

		$this.setRightNavButton = $this.setActivityButton;

		// BackButtonDisabled
		// ======================================

		var backButtonDisabledNoOp = null;

		$this.setBackButtonDisabled = function(v) {
			if (v === true) {
				backButtonDisabledNoOp = function(){ return false; };
				$this.addEventListener('androidback', backButtonDisabledNoOp);
			} else {
				if (_.isFunction(backButtonDisabledNoOp)) {
					$this.removeEventListener('androidback', $this.backButtonDisabledNoOp);
				}
			}
		};


		// Title
		// =======================================

		$this._processTitles = function () {
			$this.activity.title = $this.title;
			$this.activity.subtitle = $this.subtitle;
		};

		$this.setTitle = function(value) {
			$this.title = value;
			$this._processTitles();
		};

		$this.setSubtitle = function(value) {
			$this.subtitle = value;
			$this._processTitles();
		};

	}


	// ==================================
	// PARSE ARGUMENTS AND INITIALIZATION
	// ==================================

	if (args.deferredBackgroundImage != null) $this.setDeferredBackgroundImage(args.deferredBackgroundImage);
	if (args.backgroundCoverImage != null) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	if (OS_ANDROID) {

		$this._processTitles();

		if (args.activityProperties != null) $this.setActivityProperties(args.activityProperties);
		if (args.actionBarProperties != null) $this.setActionBarProperties(args.actionBarProperties);

		if (args.rightNavButton != null) $this.setRightNavButton(args.rightNavButton);
		if (args.activityButtons != null) {
			_.each(args.activityButtons, function(val) { $this.addActivityButton(val); });
		}
		if (args.activityButton != null) $this.setActivityButton(args.activityButton);
		if (args.displayHomeAsUp != null) $this.setDisplayHomeAsUp(args.displayHomeAsUp);

	}

	return $this;
};