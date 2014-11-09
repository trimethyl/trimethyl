/**
 * @class 	Image
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
 * If `width` and `height` are both passed, the image will be resized
 * stretching the image with the specified width and height.
 *
 * When you set `retina : true`, the output size is multipied for density factor.
 *
 * ## Output options
 *
 * `filename`: output the blob in the filesystem and release memory blob
 *
 * @param  {Object} opt The options, see the description above.
 * @return {Object} {Ti.Blob/Ti.File}
 */
exports.process = function(opt) {
	if (opt.blob == null) {
		return Ti.API.error('Image: Blob is null');
	}

	var density = opt.retina === true ? Alloy.Globals.SCREEN_DENSITY : 1;
	var R = null;

	if (opt.size != null) {
		R = opt.blob.imageAsThumbnail(opt.size*density);
	} else if (opt.width != null || opt.height != null) {
		opt.width = opt.width || opt.height * (opt.blob.width / opt.blob.height);
		opt.height = opt.height || opt.width * (opt.blob.height / opt.blob.width);
		R = opt.blob.imageAsResized(opt.width * density, opt.height * density);
	} else {
		R = opt.blob;
	}

	if (R == null) {
		return Ti.API.error('Image: Unexeptected error');
	}

	if (opt.filename == null) {
		return R;
	}

	var file = Ti.Filesystem.getFile(require('T/util').getAppDataDirectory(), opt.filename);
	var result = file.write(R);
	R = null; // GC

	if (result === false) {
		return Ti.API.error('Image: Unexeptected error while writing file');
	}

	return file;
};
