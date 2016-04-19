/**
 * @module 	image
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * Process the image and output in memory/filesystem
 *
 * `blob` is required to process the image, or an error is thrown
 *
 * ## Resizing options
 *
 * If `size` is passed, the image will be thumbnailized in a square.
 *
 * If `width` is passed the image will be resized with the specified width maintaining the ratio.
 *
 * If `height` is passed the image will be resized with the specified height maintaining the ratio.
 *
 * If `width` and `height` are both passed, the image will be resized as a *cover* method.
 *
 * If `retina` is passed, that factor is multiplied.
 *
 * ## Output options
 *
 * `filename`: output the blob in the filesystem and release memory blob
 *
 * `file`: set the Ti.File output (opt.)
 *
 * @param  {Object} opt The options, see the description above.
 * @return {Object} {Ti.Blob/Ti.File}
 */
exports.process = function(opt) {
	if (opt.blob == null) {
		Ti.API.error('Image: Blob is null or not instanceof Ti.Blob');
		return false;
	}

	var ratio = opt.retina === true ? Alloy.Globals.SCREEN_DENSITY : 1;
	var R = null;

	if (opt.size != null) {

		// Thumb
		R = opt.blob.imageAsThumbnail( opt.size * ratio );

	} else if (opt.width != null && opt.height != null) {

		// Cover
		var inr = opt.blob.width / opt.blob.height;
		var outr = opt.width / opt.height;
		if (outr > inr) {
			R = opt.blob.imageAsResized(ratio * opt.width, ratio * Math.floor(opt.width / inr));
		} else {
			R = opt.blob.imageAsResized(ratio * Math.floor(opt.height * inr), ratio * opt.height);
		}
		R = R.imageAsCropped({
			width: ratio * opt.width,
			height: ratio * opt.height
		});

	} else if (opt.width != null || opt.height != null) {

		// Get one of the sizes, and calculate the other
		opt.width = opt.width || opt.height * (opt.blob.width / opt.blob.height);
		opt.height = opt.height || opt.width * (opt.blob.height / opt.blob.width);

		R = opt.blob.imageAsResized( ratio * opt.width, ratio * opt.height );

	} else {

		R = opt.blob;

	}

	if (R == null) {
		Ti.API.error('Image: Unexpected error');
		return false;
	}

	if (opt.filename != null || opt.file != null) {

		var file = opt.file || Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, opt.filename);
		var result = file.write(R);

		if (result === false) {
			Ti.API.error('Image: Unexepected error while writing file');
			return false;
		}

		return file;
	} else {
		return R;
	}
};
