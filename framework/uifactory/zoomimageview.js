/**
 * @class  	UIFactory.ZoomImageView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * An ImageView with the pinch-to-zoom feature included.
 */

module.exports = function(args) {
	_.defaults(args, {
		zoomScale: 1,
		minZoomScale: 1,
		maxZoomScale: 2
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

			$this.imageView = $.UI.create('ImageView', {
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
