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
}, (Alloy.CFG.T && Alloy.CFG.T.auth) ? Alloy.CFG.T.auth.facebook : {});

var Facebook = require('facebook');

Facebook.appid = Ti.App.Properties.getString('ti.facebook.appid');
if (config.permissions != null) {
	Facebook.permissions = exports.config.permissions;
}

module.exports = Facebook;