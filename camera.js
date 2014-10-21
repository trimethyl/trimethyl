/**
 * @class  Camera
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.camera);
exports.config = config;


/**
 * Call showCamera or openPhotoGallery using same options
 * @private
 * @param  {String}   method 		Must be one of showCamera or openPhotoGallery
 * @param  {Object}   opt 			Options passed to `Ti.Media.FUNC`
 * @param  {Function} callback  	Success callback
 */
function getPhoto(method, opt, callback){
	Ti.Media[method](_.extend({}, opt, {
		mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO ],
		saveToPhotoGallery: (method === 'showCamera'),
		success: callback,
		cancel: function(e) {
			Ti.API.warn('Camera: Cancelled', e);
		},
		error: function(e) {
			Ti.API.error('Camera: Error', e);
			require('T/util').errorAlert(L('camera_inputerror'));
		}
	}));
}

/**
 * @method takePhoto
 * Open the Camera to take a photo
 *
 * @param  {Object}   opt 			Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback  	Success callback
 */
exports.takePhoto = function(opt, callback) {
	getPhoto('showCamera', opt, callback);
};

/**
 * @method choosePhoto
 * Open the Gallery to chooose a photo
 *
 * @param  {Object}   opt 			Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback  	Success callback
 */
exports.choosePhoto = function(opt, callback) {
	getPhoto('openPhotoGallery', opt, callback);
};

/**
 * @method selectPhoto
 * Display an option dialog to prompt the user to take a photo with the camera or select a photo from the gallery
 *
 * @param  {Object}   opt 			Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback  	Success callback
 */
exports.selectPhoto = function(opt, callback){
	require('T/dialog').option(L('camera_chooseinput'), [
	{
		title: L('camera_takephoto'),
		callback: function(){ exports.takePhoto(opt, callback); }
	},
	{
		title: L('camera_choosephoto'),
		callback: function(){ exports.choosePhoto(opt, callback); }
	}
	]);
};