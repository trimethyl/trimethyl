/*

Image manipulation module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio -g install ti.imagefactory

*/

var config = _.extend({}, Alloy.CFG.image);
var $$ = require('ti.imagefactory');

function fsave(opt) {
	var file = Ti.Filesystem.getFile(require('util').getAppDataDirectory(), opt.filename);
	var result = file.write(opt.blob);

	if (!result) {
		Ti.API.error("Image: error writing file");
		return opt.callback();
	}

	return opt.callback(file);
}

exports.process = function(opt) {
	var density = opt.retina ? require('device').getScreenDensity() : 1;
	var R = null;

	if (opt.size) {

		R = $$.imageAsThumbnail(opt.blob, {
			size: opt.size*density,
		});

	} else if (opt.width || opt.height) {

		opt.width = opt.width || opt.height*(opt.blob.width/opt.blob.height);
		opt.height = opt.height ||  opt.width*(opt.blob.height/opt.blob.width);
		R = $$.imageAsResized(opt.blob, {
			width: opt.width*density,
			height: opt.height*density
		});

	} else {
		R = opt.blob;
	}

	// Error
	if (!R) {
		return opt.callback();
	}

	// Success

	if (opt.quality) {
		R = $$.compress(R, +opt.quality);
	}

	if (opt.filename) {
		return fsave({
			filename: opt.filename,
			blob: R,
			callback: opt.callback
		});
	} else {
		return opt.callback(R);
	}
};