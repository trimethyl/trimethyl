/**
 * @class  Camera
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Manage Camera access
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
 * @param  {String}   method Must be one of showCamera or openPhotoGallery
 * @param  {Object}   opt Options passed to **Ti.Media.function**
 * @param  {Function} cb  Success callback
 */
function getPhoto(method, opt, cb){
	Ti.Media[method](_.extend(opt || {}, {
		mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO ],
		saveToPhotoGallery: (method=='showCamera'),
		success: cb,
		cancel: function(e) {
			Ti.API.warn("Camera: Cancelled ("+JSON.stringify(e)+")");
		},
		error: function(e) {
			Ti.API.error("Camera: Error ("+JSON.stringify(e)+")");
			require('T/util').alertError(L('camera_error'));
		},
	}));
}

/**
 * Open the Camera to take a photo
 *
 * @param  {Object}   opt Options passed to **Ti.Media.showCamera**
 * @param  {Function} cb  Success callback
 */
function takePhoto(opt, cb) {
	getPhoto('showCamera', opt, cb);
}
exports.takePhoto = takePhoto;


/**
 * Open the Gallery to chooose a photo
 *
 * @param  {Object}   opt Options passed to **Ti.Media.showCamera**
 * @param  {Function} cb  Success callback
 */
function choosePhoto(opt, cb) {
	getPhoto('openPhotoGallery', opt, cb);
}
exports.choosePhoto = choosePhoto;


/**
 * Display an option dialog to prompt the user to take a photo with the camera or select a photo from the gallery
 *
 * @param  {Object}   opt Options passed to **Ti.Media.showCamera**
 * @param  {Function} cb  Success callback
 */
function selectPhoto(opt, cb){
	require('T/util').optionWithDict([
	{
		title: L('camera_takephoto'),
		callback: function(){
			takePhoto(opt, cb);
		}
	},
	{
		title: L('camera_choosephoto'),
		callback: function(){
			choosePhoto(opt, cb);
		}
	}
	]);
}
exports.selectPhoto = selectPhoto;