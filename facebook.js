/**
 * @class Facebook
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * * `appid` Application ID. Default: `null`
 * * `permissions` Array of permissions. Default: `[]`
 * @type {Object}
 */
var config = _.extend({
	appid: null,
	permissions: [],
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;

var Facebook = require('facebook');

if (Facebook != null) {

	if (Facebook.appid == null) {
		if (config.appid != null) {
			Facebook.appid = config.appid;
		} else if (Ti.App.Properties.hasProperty('ti.facebook.appid')) {
			Facebook.appid = Ti.App.Properties.getString('ti.facebook.appid', false);
		} else {
			Ti.API.warn('Facebook: Please specify a Facebook AppID');
		}
	}

	if (config.permissions != null) {
		Facebook.permissions = _.isArray(config.permissions) ? config.permissions : config.permissions.split(',');
	}
}

module.exports = Facebook;