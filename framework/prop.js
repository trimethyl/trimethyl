/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 * @property {Bool} [config.allowSync=true] Whether to sync data with iCloud
 * @property {String [config.accessGroup=null] Access groups can be used to share keychain items among two or more applications
 * @property {Boolean} [config.encryptFieldNames=false] When set to true, Securely will create an MD5 hash using the provided secret for all property names.
 * @property {Method} [config.method="dynamic"] If "static", config.encryptionKey will be used as a secret. If "dynamic", a dynamic generated key will be used as a secret.
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true,
	accessGroup: null,
	encryptFieldNames: false,
	method: 'dynamic'
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');
var Securely = Util.requireOrNull('bencoding.securely');

var dynamicKeyGenerator = null;

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your prop storage is not secure");
	module.exports = Ti.App.Properties;
} else {
	switch (exports.config.method) {
		case 'static':
		module.exports = initWithStaticKey();
		break;
		case 'dynamic':
		module.exports = initWithDynamicKey();
		break;
		default:
		throw new Error(MODULE_NAME, 'invalid method used');
		break;
	}
}

/**
 * Private functions
 */

function initWithStaticKey() {
	return Securely.createProperties({
		identifier: Ti.App.id + '_static',
		secret: exports.config.encryptionKey,
		accessGroup: exports.config.accessGroup,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});
}

function initWithDynamicKey() {
	var field_key = Ti.Utils.sha256(Ti.App.id + '_secret');
	var final_key = null;

	var static_storage = initWithStaticKey();

	if (false === static_storage.hasProperty(field_key)) {
		var dy_key = _.isFunction(dynamicKeyGenerator) ? dynamicKeyGenerator(dy_key) : Securely.generateRandomKey();
		static_storage.setString(field_key, dy_key);
		final_key = dy_key;
	} else {
		final_key = static_storage.getString(field_key);
	}

	return Securely.createProperties({
		secret: final_key,
		accessGroup: exports.config.accessGroup,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});
}

/**
 * Public functions
 */

/**
 * Change the dynamic key generator
 * @param {Function} fn The function to call
 */
exports.setDynamicKeyGenerator = function(fn) {
	dynamicKeyGenerator = fn;
};
