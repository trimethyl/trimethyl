/**
 * @class  	UIFactory.BackgroundView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = _.defaults(args || {}, {
		imageSize: 24,
		imageOffset: 20
	});

	var $this = Ti.UI.createView(args);

	/**
	 * @method showLoader
	 * Show the loader and hide the left image
	 */
	$this.showLoader = function() {
		$this.loaderView.show();
		$this.imageView.opacity = 0;
		$this.touchEnabled = false;
		$this.labelView.animate({ 
			left: $this.imageOffset*2 + $this.imageSize 
		});
	};

	/**
	 * @method hideLoader
	 * Hide the loader and show the left image
	 */
	$this.hideLoader = function() {
		$this.loaderView.hide();
		$this.imageView.opacity =1;
		$this.touchEnabled = true;
		$this.labelView.animate({ 
			left: $this.imageOffset + ($this.image == null ? 0 : ($this.imageSize + $this.imageOffset/2)) 
		});
	};

	/**
	 * @method setTitle
	 * @param {String} title
	 * Set the title for the button
	 */
	$this.setTitle = function(title) {
		$this.title = title;
		$this.labelView.text = $this.title;
	};

	/**
	 * @method setImage
	 * @param {String} image
	 * Set the left image for the button
	 */
	$this.setImage = function(image) {
		$this.image = image;
		$this.imageView.image = image;
	};

	//////////
	// Init //
	//////////

	$this.loaderView = Ti.UI.createActivityIndicator({
		left: $this.imageOffset,
		width: $this.imageSize
	});
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
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	$this.add( $this.labelView );

	return $this;
};