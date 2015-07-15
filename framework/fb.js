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
var Facebook = require('facebook');

// Old Facebook module require that the app-id is set at runtime
Facebook.appid = Ti.App.Properties.getString('ti.facebook.appid');

if (!_.isEmpty(exports.config.permissions)) {
	Facebook.setPermissions(exports.config.permissions);
}

if (_.isFunction(Facebook.initialize)) {
	Facebook.initialize();
}

module.exports = Facebook;