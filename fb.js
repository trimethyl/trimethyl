/**
 * @class 	Facebook
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Array} [config.permissions=[]] Array of permissions
 */
exports.config = _.extend({
	permissions: [],
}, Alloy.CFG.T ? Alloy.CFG.T.facebook : {});

var Util = require('T/util');
var Facebook = Util.requireOrNull('com.facebook') || Util.requireOrNull('facebook');

Facebook.appid = Facebook.appid || Ti.App.Properties.getString('ti.facebook.appid');
if (!_.isEmpty(exports.config.permissions)) {
	Facebook.permissions = exports.config.permissions;
}

Facebook.getCanPresentShareDialog = Facebook.getCanPresentShareDialog || function() {
	return true;
};

module.exports = Facebook;