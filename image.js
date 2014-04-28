/*

Image manipulation module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio -g install ti.imagefactory

*/

var config = _.extend({}, Alloy.CFG.image);

function fsave(opt) {
	var file = Ti.Filesystem.getFile(require('util').getAppDataDirectory(), opt.filename);
	if (!file.write(opt.blob)) {
		opt.blob = null;
		return opt.callback(false);
	}
	opt.blob = null;
	opt.callback(file);
}

exports.process = function(opt) {
	var $$ = require('ti.imagefactory');
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

	if (!R) {
		return opt.callback();
	}

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