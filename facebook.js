/**
 * @class Facebook
 * @author Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * * `permissions`: Array of permissions. Default: `[]`
 * @type {Object}
 */
var config = _.extend({
	permissions: [],
}, Alloy.CFG.T.auth ? Alloy.CFG.T.auth.facebook : {});
exports.config = config;

var Facebook = require('facebook');

Facebook.appid = require('T/prop').getString('ti.facebook.appid');
if (config.permissions != null) {
	Facebook.permissions = _.isArray(config.permissions) ? config.permissions : config.permissions.split(',');
}

module.exports = Facebook;