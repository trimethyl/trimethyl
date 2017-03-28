/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');

var Securely = Util.requireOrNull('bencoding.securely');

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your auth storage is not secure");
	module.exports = Ti.App.Properties;
} else {
	module.exports = Securely.createProperties({
		secret: exports.config.encryptionKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION,
	});
}