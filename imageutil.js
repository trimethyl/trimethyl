/**
 * @class  	ImageUtil
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Image manipulation module
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.T.imageutil);
exports.config = config;


/**
 * Process the image and output in memory or filesystem
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
 * ## Optional parameters
 *
 * `quality`: to degrade the image
 *
 * ## Output options
 *
 * `filename`: output the blob in the filesystem and release memory blob
 *
 * `success`: call the function passing the output blob or output file if the keyword `filename` is specified
 *
 * `error`: call the function in case of errors
 *
 * @param  {Object} opt The options, see the description above.
 */
function process(opt) {
	if (!opt.blob) {
		Ti.API.error("Image: Set a blob please");
		return;
	}

	var density = opt.retina ? Alloy.Globals.SCREEN_DENSITY : 1;
	var R = null;

	if (opt.size) {
		R = opt.blob.imageAsThumbnail(opt.size*density);
	} else if (opt.width || opt.height) {
		opt.width = opt.width || opt.height*(opt.blob.width/opt.blob.height);
		opt.height = opt.height || opt.width*(opt.blob.height/opt.blob.width);
		R = opt.blob.imageAsResized(opt.width*density, opt.height*density);
	} else {
		R = opt.blob;
	}

	if (!R) return;
	if (!opt.filename) return R;

	var file = Ti.Filesystem.getFile(require('T/util').getAppDataDirectory(), opt.filename);
	var result = file.write(R);
	R = null;

	if (!result) {
		Ti.API.error("Image: error writing file");
		return;
	}

	return file;
}
exports.process = process;