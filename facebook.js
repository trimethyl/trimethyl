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

if (Facebook != null) {
	if (config.permissions != null) {
		Facebook.permissions = _.isArray(config.permissions) ? config.permissions : config.permissions.split(',');
	}
}

module.exports = Facebook;