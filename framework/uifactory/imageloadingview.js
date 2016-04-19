/**
* @module  	uifactory/imageloadingview
* @author  	Andrea Jonus <andrea.jonus@caffeina.it>
*/

module.exports = function(args) {
	var hasWidth = args.width ? true : false;
	var hasHeight = args.height ? true : false;

	_.defaults(args, {
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE,

		/**
		* Sets the style of the activity indicator.
		* @property {Number} [indicatorStyle=DARK]
		*/
		indicatorStyle: OS_ANDROID ? Ti.UI.ActivityIndicatorStyle.DARK : Ti.UI.iPhone.ActivityIndicatorStyle.DARK,

		/**
		* Sets the message of the activity indicator.
		* @property {Number} [indicatorMessage]
		*/
		indicatorMessage: null,

		/**
		* Sets the message's color of the activity indicator.
		* @property {Number} [indicatorColor]
		*/
		indicatorColor: null

	});

	var img = args.image;
	var viewArgs = _.pick(args, ['height', 'width', 'left', 'top', 'right', 'bottom']);
	var imageArgs = _.omit(_.extend(args, {
		opacity: 0,
		image: null,
	}), ['height', 'width', 'left', 'top', 'right', 'bottom']);
	var indicatorArgs = {
		style: args.indicatorStyle,
		message: args.indicatorMessage,
		color: args.indicatorColor
	};

	var $this = Ti.UI.createView(viewArgs);
	$this.__indicator = Ti.UI.createActivityIndicator(indicatorArgs);
	$this.__image = Ti.UI.createImageView(imageArgs);
	$this.add($this.__image);

	var indicatorVisible = false;

	/**
	* Show an activity indicator, hiding the displayed image
	* @method  showIndicator
	*/
	$this.showIndicator = function() {
		if (indicatorVisible === true) return;
		indicatorVisible = true;

		$this.add($this.__indicator);
		$this.__indicator.applyProperties({
			height: 50,
			width: 50,
			opacity: 0
		});
		$this.__indicator.show();
	};

	/**
	* Hide this ImageView's activity indicator
	* @method  hideIndicator
	*/
	$this.hideIndicator = function() {
		if (indicatorVisible === false) return;
		indicatorVisible = false;

		$this.__indicator.hide();
		$this.__image.opacity = 1;
		$this.remove($this.__indicator);
	};

	/**
	* Toggle the visibility of this ImageView's activity indicator
	* @method  toggleIndicator
	* @param {boolean} visible
	*/
	$this.toggleIndicator = function(visible) {
		if (visible) $this.showIndicator();
		else $this.hideIndicator();
	};

	/**
	* Sets the image of this ImageView
	* @method  setImage
	* @param {String|Titanium.Blob|Titanium.Filesystem.File} image
	*/
	$this.setImage = function(image) {
		$this.__image.image = image;
	};

	/**
	* Returns the image of this ImageView
	* @method getImage
	* @returns {String|Titanium.Blob|Titanium.Filesystem.File}
	*/
	$this.getImage = function() {
		return $this.__image.image;
	};

	///////////
	// Init //
	///////////

	$this.__image.image = img;

	$this.__image.addEventListener('load', function() {
		if (hasHeight && hasWidth) {
			$this.__image.height = $this.rect.height;
			$this.__image.width = $this.rect.width;
		} else if (hasHeight) {
			$this.__image.height = $this.rect.height;
			$this.width = Ti.UI.SIZE;
		} else if (hasWidth) {
			$this.__image.width = $this.rect.width;
			$this.height = Ti.UI.SIZE;
		}

		$this.hideIndicator();
	});

	$this.showIndicator();

	return $this;
};
