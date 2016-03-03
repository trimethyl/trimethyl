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

	$this.showLoader = function() {
		$this.loaderView.show();
		$this.imageView.opacity = 0;
		$this.touchEnabled = false;
		$this.labelView.animate({ 
			left: args.imageOffset*2 + args.imageSize 
		});
	};

	$this.hideLoader = function() {
		$this.loaderView.hide();
		$this.imageView.opacity =1;
		$this.touchEnabled = true;
		$this.labelView.animate({ 
			left: args.imageOffset + (args.image == null ? 0 : (args.imageSize + args.imageOffset/2)) 
		});
	};

	$this.loaderView = Ti.UI.createActivityIndicator({
		left: args.imageOffset,
		width: args.imageSize
	});
	$this.add( $this.loaderView );

	$this.imageView = Ti.UI.createImageView({
		image: args.image,
		left: args.imageOffset,
		width: args.imageSize
	});
	$this.add( $this.imageView );

	$this.labelView = Ti.UI.createLabel({
		left: args.imageOffset + (args.image == null ? 0 : (args.imageSize + args.imageOffset/2)),
		right: args.imageOffset,
		text: args.title,
		font: args.font,
		color: args.color,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER
	});
	$this.add( $this.labelView );

	return $this;
};