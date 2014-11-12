/**
 * @class  	UIFactory.Window
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	_.defaults(args, {

		/**
		 * @property {Boolean} [displayHomeAsUp=false] **(Android only)** Set the property `displayHomeAsUp` and the relative close listener.
		 */
		displayHomeAsUp: false,

		/**
		 * @property {Boolean} [backButtonDisabled=false] **(Android only)** Disable the hardware back button (do nothing on click)
		 */
		backButtonDisabled: false,

		/**
		 * @property {String} [deferredBackgroundImage=null] View {@link setDeferredBackgroundImage}
		 */
		deferredBackgroundImage: null,

		/**
		 * @property {String} [backgroundCoverImage=null] View {@link setBackgroundCoverImage}
		 */
		backgroundCoverImage: null,

		/**
		 * @property {Object} [activityProperties=null] View {@link setActivityProperties}
		 */
		activityProperties: null,

		/**
		 * @property {Object} [actionBarProperties=null] View {@link setActionBarProperties}
		 */
		actionBarProperties: null,

		/**
		 * @property {Object} [rightNavButton=null] View {@link setRightNavButton}
		 */
		rightNavButton: null,

		/**
		 * @property {Array} [activityButtons=null] View {@link addActivityButton}
		 */
		activityButtons: null,

		/**
		 * @property {Object} [activityButton=null] View {@link setActivityButton}
		 */
		activityButton: null

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

	$this.addEventListener('open', function() {
		$this.opened = true;
		_.each(onOpenFuncs, function(openFunc){
			openFunc();
		});
	});


	/**
	 * @method setDeferredBackgroundImage
	 * When large images are requested, it's useful to set `deferredBackgroundImage` to set the background on window open.
	 * @param {String} val
	 */
	$this.setDeferredBackgroundImage = function(val) {
		onOpen(function() {
			$this.backgroundImage = val;
		});
	};

	var bgCoverUI = null;
	var bgCoverUISview = null;
	var bgCoverUIRelayouted = false;

	function bgCoverRelayout() {
		var imgSize = bgCoverUI.size;
		var winSize = bgCoverUISview.size;
		var imgRatio = imgSize.width / imgSize.height;
		var winRatio = winSize.width / winSize.height;

		bgCoverUI.applyProperties(
			winRatio > imgRatio ?
			{ opacity: 1, width: winSize.width, height: winSize.width / imgRatio } :
			{ opacity: 1, width: winSize.height * imgRatio, height: winSize.height }
		);
	}

	/**
	 * @method setBackgroundCoverImage
	 * Titanium doesn't have `backgroundSize: cover` property. This is a workaround to make it work it!
	 * @param {String} val
	 */
	$this.setBackgroundCoverImage = function(val) {
		if (bgCoverUI !== null) {
			bgCoverUI.image = val;
			bgCoverUIRelayouted = false;
		} else {

			bgCoverUISview = Ti.UI.createScrollView({
				touchEnabled: false,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				zIndex: -1
			});
			bgCoverUI = Ti.UI.createImageView({
				image: val,
				opacity: 0
			});
			bgCoverUISview.add(bgCoverUI);
			$this.add(bgCoverUISview);

			bgCoverUI.addEventListener('postlayout', function() {
				if (bgCoverUIRelayouted === true) return;
				bgCoverUIRelayouted = true;
				bgCoverRelayout();
			});

			Ti.Gesture.addEventListener('orientationchange', bgCoverRelayout);
			$this.addEventListener('close', function() {
				Ti.Gesture.removeEventListener('orientationchange', bgCoverRelayout);
			});
		}
	};

	if (OS_ANDROID) {

		/**
		 * @method setActivityProperties
		 * Set the properties for the Activity
		 * @param {Object} props
		 */
		$this.setActivityProperties = function(props) {
			_.each(props, function(v, k) {
				$this.activity[k] = v;
			});
		};

		/**
		 * @method setActionBarProperties
		 * Set the properties for the ActionBar
		 * @param {Object}   props
		 * @param {Function} callback
		 */
		$this.setActionBarProperties = function(props, callback) {
			onOpen(function(){
				if ($this.activity.actionBar == null) return;

				_.each(props, function(v, k) {
					$this.activity.actionBar[k] = v;
				});
				if (_.isFunction(callback)) callback($this.activity.actionBar);
			});
		};


		var activityButtons = [];

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

		/**
		 * @method addActivityButton
		 * **Android specific**
		 * @param {Object} opt
		 */
		$this.addActivityButton = function(opt) {
			while (opt.children && opt.children[0]) opt = opt.children[0]; // hack for Alloy, just ignore it
			activityButtons.push(opt);
		};

		/**
		 * @method setActivityButton
		 * **Android specific**
		 * @param {Object} opt
		 */
		$this.setActivityButton = function(opt) {
			activityButtons = [];
			$this.addActivityButton(opt);
		};

 		/**
 		 * @method setRightNavButton
 		 * @inheritDoc #setActivityButton
 		 * Alias for {@link #setActivityButton}
 		 */
		$this.setRightNavButton = $this.setActivityButton;


		/**
		 * @method processTitles
		 * Auto-process the titles
		 */
		$this.processTitles = function () {
			var bar = {};
			if ($this.subtitle != null) {
				bar = { title: $this.title, subtitle: $this.subtitle };
			} else {
				bar = { title: Ti.App.name, subtitle: $this.title || '' };
			}
			$this.setActionBarProperties(bar);
		};

		/**
		 * @method setTitle
		 * **Android fix**
		 * @param {String} value
		 */
		$this.setTitle = function(value) {
			$this.title = value;
			$this.processTitles();
		};

		/**
		 * @method setSubtitle
		 * **Android fix**
		 * @param {String} value
		 */
		$this.setSubtitle = function(value) {
			$this.subtitle = value;
			$this.processTitles();
		};

	}


	// ==================================
	// PARSE ARGUMENTS AND INITIALIZATION
	// ==================================

	if (args.deferredBackgroundImage != null) $this.setDeferredBackgroundImage(args.deferredBackgroundImage);
	if (args.backgroundCoverImage != null) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	if (OS_ANDROID) {

		$this.processTitles();

		if (args.displayHomeAsUp === true && args.exitOnClose !== true) {
			$this.setActionBarProperties({
				displayHomeAsUp: true,
				onHomeIconItemSelected: function() {
					$this.close();
				}
			});
		}

		if (args.backButtonDisabled === true) {
			$this.addEventListener('androidback', function() {
				return false;
			});
		}

		if (args.activityProperties != null) $this.setActivityProperties(args.activityProperties);
		if (args.actionBarProperties != null) $this.setActionBarProperties(args.actionBarProperties);
		if (args.rightNavButton != null) $this.setRightNavButton(args.rightNavButton);
		if (args.activityButtons != null) _.each(args.activityButtons, function(val) { $this.addActivityButton(val); });
		if (args.activityButton != null) $this.setActivityButton(args.activityButton);
	}

	return $this;
};