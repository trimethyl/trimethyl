var config = {};

function getPhoto(method, opt, cb){
	Ti.Media[method](_.extend(opt || {}, {
		/*allowEditing: false,
		animated: true,
		autohide: true,
		inPopOver: false,*/
		mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO, Ti.Media.MEDIA_TYPE_VIDEO ],
		saveToPhotoGallery: (method=='takePhoto'),/*
		showControls: true
		*/
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