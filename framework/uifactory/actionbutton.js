/**
 * @module  uifactory/backgroundview
 * @author  Flavio De Stefano <flavio.destefano@caffeina.com>
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

module.exports = function(args) {
	args = _.defaults(args || {}, {
		imageSize: 24,
		imageOffset: 20
	});

	var $this = Ti.UI.createView(args);

	/**
	 * Show the loader and hide the left image
	 * @method  showLoader
	 * @param {String} loadingTitle	The new optional title to show
	 */
	$this.showLoader = function(loadingTitle) {
		$this.loaderView.show();
		$this.imageView.opacity = 0;
		$this.touchEnabled = false;
		
		$this.oldTitle = $this.title;
		$this.setTitle(loadingTitle);

		$this.labelView.animate({ 
			left: $this.imageOffset*2 + $this.imageSize 
		});
	};

	/**
	 * Hide the loader and show the left image
	 * @method  hideLoader
	 * @param {String} newTitle	The new title to apply
	 */
	$this.hideLoader = function(newTitle) {
		$this.loaderView.hide();
		$this.imageView.opacity =1;
		$this.touchEnabled = true;

		if (newTitle != null) {
			$this.setTitle( newTitle );
		} else if ($this.oldTitle != null) {
			$this.setTitle( $this.oldTitle );
		}
		$this.oldTitle = null;

		$this.labelView.animate({ 
			left: $this.imageOffset + ($this.image == null ? 0 : ($this.imageSize + $this.imageOffset/2)) 
		});
	};

	/**
	 * Set the title for the button
	 * @method  setTitle
	 * @param {String} title
	 */
	$this.setTitle = function(title) {
		$this.title = title;
		$this.labelView.text = $this.title;
	};

	/**
	 * Set the left image for the button
	 * @method  setImage
	 * @param {String} image
	 */
	$this.setImage = function(image) {
		$this.image = image;
		$this.imageView.image = image;
	};

	//////////
	// Init //
	//////////

	$this.loaderView = Ti.UI.createActivityIndicator(_.extend({
		left: $this.imageOffset,
		width: $this.imageSize,
	}, $this.indicatorColor != null ? { indicatorColor: $this.indicatorColor } : {}));
	$this.add( $this.loaderView );

	$this.imageView = Ti.UI.createImageView({
		image: $this.image,
		left: $this.imageOffset,
		width: $this.imageSize
	});
	$this.add( $this.imageView );

	$this.labelView = Ti.UI.createLabel({
		left: $this.imageOffset + ($this.image == null ? 0 : ($this.imageSize + $this.imageOffset/2)),
		right: $this.imageOffset,
		text: $this.title,
		font: $this.font,
		color: $this.color,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		overrideCurrentAnimation: true
	});
	$this.add( $this.labelView );

	return $this;
};