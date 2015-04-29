/**
* @class  	ImageView
* @author  Andrea Jonus <andrea.jonus@caffeina.it>
*/

module.exports = function(args) {
	var hasWidth = args.width ? true : false;
	var hasHeight = args.height ? true : false;

	_.defaults(args, {
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE,

		/**
		* @property {Number} [indicatorStyle] Sets the style of the activity indicator. See [Ti.UI.ActivityIndicator.style]{@link http://docs.appcelerator.com/titanium/3.0/#!/api/Titanium.UI.ActivityIndicator-property-style}
		* @default [Ti.UI.ActivityIndicatorStyle.DARK|Ti.UI.iPhone.ActivityIndicatorStyle.DARK]
		*/
		indicatorStyle: OS_ANDROID ? Ti.UI.ActivityIndicatorStyle.DARK : Ti.UI.iPhone.ActivityIndicatorStyle.DARK,

		/**
		* @property {Number} [indicatorMessage] Sets the message of the activity indicator. See [Ti.UI.ActivityIndicator.message]{@link http://docs.appcelerator.com/titanium/3.0/#!/api/Titanium.UI.ActivityIndicator-property-message}
		* @default [null]
		*/
		indicatorMessage: null,

		/**
		* @property {Number} [indicatorMessage] Sets the message's color of the activity indicator. See [Ti.UI.ActivityIndicator.color]{@link http://docs.appcelerator.com/titanium/3.0/#!/api/Titanium.UI.ActivityIndicator-property-color}
		* @default [null]
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
	* @method showIndicator
	* Show an activity indicator, hiding the displayed image
	*/
	$this.showIndicator = function() {
		if (indicatorVisible) return;
		indicatorVisible = true;
		$this.add($this.__indicator);
		$this.__indicator.height = 50;
		$this.__indicator.width = 50;
		$this.__indicator.show();
		$this.__image.opacity = 0;
	};

	/**
	* @method hideIndicator
	* Hide this ImageView's activity indicator
	*/
	$this.hideIndicator = function() {
		if (!indicatorVisible) return;
		indicatorVisible = false;
		$this.__indicator.hide();
		$this.__image.opacity = 1;
		$this.remove($this.__indicator);
	};

	/**
	* @method toggleIndicator
	* Toggle the visibility of this ImageView's activity indicator
	* @param {boolean} visible
	*/
	$this.toggleIndicator = function(visible) {
		if (visible) $this.showIndicator(); else $this.hideIndicator();
	};

	/**
	* @method setImage
	* Sets the image of this ImageView
	* @param {String|Titanium.Blob|Titanium.Filesystem.File} image
	*/
	$this.setImage = function(image) {
		$this.__image.image = image;
	};

	/**
	* @method getImage
	* Returns the image of this ImageView
	* @returns {String|Titanium.Blob|Titanium.Filesystem.File}
	*/
	$this.getImage = function() {
		return $this.__image.image;
	};

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
