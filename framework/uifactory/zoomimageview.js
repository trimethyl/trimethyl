/**
 * @class  	UIFactory.ZoomImageView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * An ImageView with the pinch-to-zoom feature included.
 */

module.exports = function(args) {
	_.defaults(args, {

		/**
		 * @property zoomScale
		 * @type {Number}
		 * The current zoom scale
		 */
		zoomScale: 1,

		/**
		 * @property minZoomScale
		 * @type {Number}
		 * The min zoom scale
		 */
		minZoomScale: 1,

		/**
		 * @property maxZoomScale
		 * @type {Number}
		 * The max zoom scale
		 */
		maxZoomScale: 2,

		/**
		 * @property image
		 * @type {String}
		 * The image to show
		 */
		image: null

	});

	if (OS_IOS) {
		return (function() {

			var $this = Ti.UI.createScrollView({
				zoomScale: args.zoomScale,
				minZoomScale: args.minZoomScale,
				maxZoomScale: args.maxZoomScale
			});

			// Double tab listener to zoom in
			$this.addEventListener('doubletap', function(e) {
				var m = ( $this.maxZoomScale - $this.minZoomScale ) / 2;
				var upper = ( $this.zoomScale > m );
				$this.setZoomScale(upper ? $this.minZoomScale : $this.maxZoomScale, { animated: true });
			});

			/**
			 * @method setImage
			 * @param {String} image
			 */
			$this.setImage = function(image) {
				$this.imageView.image = image;
			};

			$this.imageView = Ti.UI.createImageView({
				defaultImage: null,
				image: args.image,
				width: Alloy.Globals.SCREEN_WIDTH,
				height: Ti.UI.SIZE
			});
			$this.add($this.imageView);

			return $this;

		})();
	} else if (OS_ANDROID) {
		return (function() {

			return require('org.iotashan.TiTouchImageView').createView({
				minZoom: args.minZoomScale,
				image: args.image
			});

		})();
	}
};
