/**
 * @module  firebase/core
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property {Object} 	config
 * @property {String} 	config.GCMSenderID
 * @property {String} 	config.APIKey
 * @property {String} 	config.projectID
 * @property {String} 	[config.databaseURL]
 * @property {String} 	[config.storageBucket]
 * @property {String} 	config.applicationID 		**Android only.**
 * @property {String} 	config.googleAppID 			**iOS only.**
 * @property {String} 	config.bundleID 			**iOS only.**
 * @property {String} 	config.clientID 			**iOS only.**
 * @property {String} 	config.trackingID 			**iOS only.**
 * @property {String} 	config.androidClientID 		**iOS only.**
 * @property {String} 	config.deepLinkURLScheme 	**iOS only.**
 * @property {String} 	[config.logLevel] 			**iOS only.**
 * @property {String} 	[config.file] 				The name of the configuration file to read. If used, all the other parameters are ignored.
 * @type {Object}
 */
exports.config = _.extend({}, (Alloy.CFG.T && Alloy.CFG.T.firebase) ? Alloy.CFG.T.firebase.core : {});

var FCore = require('firebase.core');
FCore.configure(exports.config);

module.exports = FCore;
