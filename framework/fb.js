/**
 * @class 	Facebook
 * @author 	Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {Array} [config.permissions=[]] Array of permissions
 * @property {Number} [config.timeout] Request timeout
 */
exports.config = _.extend({
	permissions: [],
	timeout: 20000
}, Alloy.CFG.T ? (Alloy.CFG.T.fb || Alloy.CFG.T.facebook) : {});

var Util = require('T/util');
var Facebook = Util.requireOrNull('facebook');

if (Facebook) {

	if (!_.isEmpty(exports.config.permissions)) {
		Facebook.permissions = exports.config.permissions;
	}

	if (_.isFunction(Facebook.initialize)) {
		Facebook.initialize(+exports.config.timeout);
	}

}

module.exports = Facebook;