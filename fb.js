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
}, Alloy.CFG.T ? (Alloy.CFG.T.fb || Alloy.CFG.T.facebook) : {});

var Util = require('T/util');
var Facebook = Util.requireOrNull('com.facebook') || Util.requireOrNull('facebook');

Facebook.appid = Facebook.appid || Ti.App.Properties.getString('ti.facebook.appid');
if (!_.isEmpty(exports.config.permissions)) {
	Facebook.setPermissions(exports.config.permissions);
}

Facebook.getCanPresentShareDialog = Facebook.getCanPresentShareDialog || function() {
	return false;
};

Facebook.share = Facebook.share || function() {
	return false;
};

if (_.isFunction(Facebook.publishInstall)) {
    try { Facebook.publishInstall(); } catch (err) {}
}

module.exports = Facebook;