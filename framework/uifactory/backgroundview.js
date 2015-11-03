/**
 * @class  	UIFactory.BackgroundView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = _.defaults(args || {}, {
		imageSize: 'cover'
	});

	var $this = Ti.UI.createScrollView(_.extend(args, {
		scrollable: false
	}));

	$this.setImage = function(src) {
		$this.image = src;
		$img.image = src;
	};

	var $img = Ti.UI.createImageView({
		touchEnabled: false,
	});

	$img.addEventListener('load', function(e) {
		var blob = $img.toBlob();
		var img_size = { width: blob.width, height: blob.height };
		var rect_size = $this.size;
		var img_ratio = img_size.width / img_size.height;
		var rect_ratio = rect_size.width / rect_size.height;

		if ($this.imageSize === 'cover') {
			if (img_ratio > rect_ratio) {
				$img.applyProperties({ width: rect_size.height * img_ratio, height: rect_size.height });
			} else {
				$img.applyProperties({ width: rect_size.width, height: rect_size.width / img_ratio });
			}
		} else if ($this.imageSize === 'contain') {
			if (img_ratio < rect_ratio) {
				$img.applyProperties({ width: rect_size.height * img_ratio, height: rect_size.height });
			} else {
				$img.applyProperties({ width: rect_size.width, height: rect_size.width / img_ratio });
			}
		}
	});

	$this.add( $img );

	/////////////////////
	// Parse arguments //
	/////////////////////

	if (args.image != null) $this.setImage(args.image);

	return $this;
};