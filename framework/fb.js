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

if (!_.isEmpty(exports.config.permissions)) {
	Facebook.setPermissions(exports.config.permissions);
}

Facebook.initialize();

if (_.isFunction(Facebook.publishInstall)) {
	Facebook.publishInstall();
}

module.exports = Facebook;