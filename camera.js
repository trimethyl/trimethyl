/*

Camera module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};

function getPhoto(method, opt, cb){
	Ti.Media[method](_.extend(opt || {}, {
		mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO ],
		saveToPhotoGallery: (method=='showCamera'),
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

function takePhoto(opt, cb) {
	getPhoto('showCamera', opt, cb);
}
exports.takePhoto = takePhoto;

function choosePhoto(opt, cb) {
	getPhoto('openPhotoGallery', opt, cb);
}
exports.choosePhoto = choosePhoto;

exports.selectPhoto = function(opt, cb){
	require('util').option([ L('camera_takephoto'), L('camera_choosephoto'), L('Cancel') ], 2, function(i){
		switch (i) {
			case 0: takePhoto(opt, cb); break;
			case 1: choosePhoto(opt, cb); break;
		}
	});
};

exports.init = function(c) {
	config = _.extend(config, c);
};