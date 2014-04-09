/*

Image manipulation module
Author: Flavio De Stefano
Company: Caffeina SRL

Requirements:
gittio -g install ti.imagefactory

*/


var config = {};

function fsave(opt) {
	var file = Ti.Filesystem.getFile(require('util').getAppDataDirectory(), opt.filename);
	if (!file.write(opt.blob)) {
		return opt.callback(false);
	}
	opt.callback(file);
}

exports.process = function(opt) {
	var density = opt.retina ? require('device').getScreenDensity() : 1;
	var R = null;

	if (opt.size) {
		R = require('ti.imagefactory').imageAsThumbnail(opt.blob, {
			size: opt.size*density
		});
	} else if (opt.width || opt.height) {
		opt.width = opt.width || opt.height*(opt.blob.width/opt.blob.height);
		opt.height = opt.height ||  opt.width*(opt.blob.height/opt.blob.width);
		R = require('ti.imagefactory').imageAsResized(opt.blob, {
			width: opt.width*density,
			height: opt.height*density
		});
	} else {
		R = opt.blob;
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

exports.init = function(c) {
	config = _.extend(config, c);
};