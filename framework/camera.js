/**
 * @module  camera
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/*
Include methods used in this module dynamically to avoid that Titanium 
static analysis doesn't include native-language methods.
 */
Titanium.Media;
Titanium.Media.showCamera;
Titanium.Media.openPhotoGallery;

var Dialog = require('T/dialog');
var Util = require('T/util');
var Permissions = require('T/permissions/camera');

/**
 * Call showCamera or openPhotoGallery using same options
 * @private
 * @param  {String}   method    Must be one of showCamera or openPhotoGallery
 * @param  {Object}   opt       Options passed to `Ti.Media.FUNC`
 * @param  {Function} callback  Success callback
 */
function getPhoto(method, opt, callback) {
	Permissions.request(function() {
		opt = _.extend({}, opt, {
			mediaTypes: [ Ti.Media.MEDIA_TYPE_PHOTO ],
			saveToPhotoGallery: (method === 'showCamera'),
			success: callback,
			cancel: function(e) { Ti.API.warn('Camera: Cancelled', e); },
			error: function(err) {
				Ti.API.error('Camera: Error', err);
				Util.errorAlert(L('unexpected_error', 'Unexpected error'));
			}
		});

		Ti.Media[ method ](opt);
		
	}, function(err) {
		Ti.API.error('Camera: Error', err);
		Util.errorAlert(L('error_camera_permissions', 'Missing camera permissions'));
	});
}

/**
 * Open the Camera to take a photo
 *
 * @param  {Object}   opt           Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback      Success callback
 */
exports.takePhoto = function(opt, callback) {
	getPhoto('showCamera', opt, callback);
};

/**
 * Open the Gallery to chooose a photo
 *
 * @param  {Object}   opt           Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback      Success callback
 */
exports.choosePhoto = function(opt, callback) {
	getPhoto('openPhotoGallery', opt, callback);
};

/**
 * Display an option dialog to prompt the user to take a photo with the camera or select a photo from the gallery
 *
 * @param  {Object}   opt           Options passed to `Ti.Media.showCamera`
 * @param  {Function} callback      Success callback
 */
exports.selectPhoto = function(opt, callback) {
	Dialog.option(L('select_photo_source'), [
		{
			title: L('take_photo', 'Take photo'),
			callback: function() { exports.takePhoto(opt, callback); }
		},
		{
			title: L('choose_existing_photo', 'Choose existing photo'),
			callback: function() { exports.choosePhoto(opt, callback); }
		},
		{
			title: L('cancel'),
			cancel: true
		}
	]);
};