/**
 * @module  firebase/core
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property {Object} 	config
 * @property {Object} 	config.android 					The properties reserved to the Ti.Firebase Android module.
 * @property {String} 	config.android.APIKey 			Corresponds to the `api_key.current_key` key in google-services.json.
 * @property {String} 	config.android.projectID 		Corresponds to the `project_info.project_id` key in google-services.json.
 * @property {String} 	config.android.applicationID 	Corresponds to the `client_info.mobilesdk_app_id` key in google-services.json.
 * @property {Object} 	config.ios 						The properties reserved to the Ti.Firebase iOS module.
 * @property {String} 	config.ios.googleAppID 			Corresponds to the `GOOGLE_APP_ID` key in GoogleService-Info.plist.
 * @property {String} 	[config.ios.bundleID] 			Corresponds to the `BUNDLE_ID` key in GoogleService-Info.plist.
 * @property {String} 	[config.ios.clientID] 			Corresponds to the `CLIENT_ID` key in GoogleService-Info.plist.
 * @property {String} 	config.ios.trackingID 			**Deprecated** Needed to use Google Analytics.
 * @property {String} 	config.ios.androidClientID 		**Deprecated** Needed to use Firebase Invites.
 * @property {String} 	config.ios.deepLinkURLScheme 	**Deprecated** Needed to use the Durable Deep Link service.
 * @property {String} 	[config.ios.APIKey] 			Needed to use Auth. Corresponds to the `API_KEY` key in GoogleService-Info.plist.
 * @property {String} 	[config.ios.logLevel]
 * @property {String} 	config.GCMSenderID 				Needed to use Cloud Messaging. Corresponds to the `project_info.project_number` key in google-services.json and to the `GCM_SENDER_ID` key in GoogleService-Info.plist.
 * @property {String} 	[config.databaseURL] 			Needed to use Real Time Database.
 * @property {String} 	[config.storageBucket] 			Needed to use Storage Bucket.
 * @property {String} 	[config.file] 					The name of the configuration file to read. If used, all the other parameters are ignored.
 * @type {Object}
 */
exports.config = _.extend({}, (Alloy.CFG.T && Alloy.CFG.T.firebase) ? Alloy.CFG.T.firebase.core : {});

var FCore = require('firebase.core');
var mainConfig = _.omit(exports.config, ['android', 'ios']);
FCore.configure(_.extend({}, mainConfig, exports.config[OS_IOS ? 'ios' : 'android']));

module.exports = FCore;
