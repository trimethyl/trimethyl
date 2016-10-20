/**
 * @module  uifactory/backgroundview
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = _.defaults(args || {}, {
		imageSize: 'cover'
	});

	var rect_size = null;
	if (args.width == null || args.height == null) {
		Ti.API.warn('UIFactory.BackgroundView: No fixed width / height, this feature will not work as expected');
	} else {
		rect_size = _.pick(args, 'width', 'height');
	}

	args.scrollingEnabled = false;
	args.scrollType = 'vertical';
	var $this = Ti.UI.createScrollView(args);

	$this.setImage = function(src) {
		$img.image = src;
		$img.opacity = 0;
	};

	var $img = Ti.UI.createImageView({
		defaultImage: args.defaultImage || '',
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		touchEnabled: OS_IOS ? false : true
	});

	var relayout = function() {
		rect_size = rect_size || _.pick($this.size, 'width', 'height');
		if (rect_size.width == 0 || rect_size.height == 0) {
			Ti.API.error('UIFactory.BackgroundView: Found invalid dimensions in relayout, please set fixed dimensions');
			return;
		}

		var rect_r = rect_size.width / rect_size.height;
		var blob = $img.toBlob();
		if (blob == null) return;

		var img_size = _.pick(blob, 'width', 'height');
		blob = null;

		var img_r = img_size.width / img_size.height;
		var w, h;

		if (
		($this.imageSize === 'cover' && img_r > rect_r) ||
		($this.imageSize === 'contain' && img_r < rect_r)
		) {
			w = rect_size.height * img_r;
			h = rect_size.height;
		} else if (
		($this.imageSize === 'contain' && img_r > rect_r) ||
		($this.imageSize === 'cover' && img_r < rect_r)
		) {
			w = rect_size.width;
			h = rect_size.width / img_r;
		}

		$img.applyProperties({ width: w , height: h });

		if ($this.imageSize === 'cover') {
			$this.setContentOffset({
				x: ((w - rect_size.width) / 2) << 0,
				y: ((h - rect_size.height) / 2) << 0
			}, { animated: false });
		}

		$img.animate({ opacity: 1 });
	};

	$img.addEventListener('load', relayout);
	$this.add( $img );

	/////////////////////
	// Parse arguments //
	/////////////////////

	if (args.image != null) $this.setImage(args.image);

	return $this;
};