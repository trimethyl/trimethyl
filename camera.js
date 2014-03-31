/*

Camera module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

function getPhoto(method, opt, cb){
	Ti.Media[method](_.extend(opt || {}, {
		mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO, Ti.Media.MEDIA_TYPE_VIDEO ],
		saveToPhotoGallery: (method=='takePhoto'),
		success: cb,
		cancel: function(e) {
			console.warn(e);
		},
		error: function(e) {
			console.error(e);
			require('util').alertError(e.message || L('camera_error'));
		},
	}));
}

exports.savePhoto = function(opt) {
	if (opt.uniqFileName) {
		opt.fileName = require('util').uniqId() + (opt.suffixFileName || '') + '.jpg';
	}
	if (!opt.fileName) { throw 'Please specify a filename or set uniqFileName: true'; }

	var imageFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, opt.fileName);
	if (!imageFile.writable) {
		console.error("Image file is not writable");
		if (opt.error) opt.error();
		return false;
	}

	if (!imageFile.write(opt.blob)) {
		if (opt.error) opt.error();
		console.error("Can't write the image");
		return false;
	}

	if (opt.success) opt.success(imageFile);
};

exports.takePhoto = takePhoto = function(opt, cb) {
	getPhoto('showCamera', opt, cb);
};

exports.choosePhoto = choosePhoto = function(opt, cb) {
	getPhoto('openPhotoGallery', opt, cb);
};

exports.selectPhoto = function(opt, cb){
	require('util').option([
		L('camera_takephoto'), L('camera_choosephoto'), L('Cancel') ],
		2, function(i){
			switch (i) {
				case 0: takePhoto(opt, cb); break;
				case 1: choosePhoto(opt, cb); break;
			}
		});
};

exports.init = function(c) {
	config = _.extend(config, c);
};