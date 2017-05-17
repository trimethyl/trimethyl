/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 * * @property {Bool} [config.allowSync=true] Whether to sync data with iCloud
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');
var Securely = Util.requireOrNull('bencoding.securely');
exports.generator = null;

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your auth storage is not secure");
	module.exports = Ti.App.Properties;
} else {
	module.exports = initWithStaticAndDynamicKeys();
}

/**
 * Private functions
 */

function initWithStaticAndDynamicKeys() {
	var stringCrypto = Securely.createStringCrypto();
	var id = stringCrypto.sha256(Ti.App.id);
	var encKey = null;
	var starter = Securely.createProperties({
		identifier: "_" + Ti.App.id + ".starter",
		secret: exports.config.encryptionKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});

	// Saving dynamic key in keychain with key "Ti.App.id" and secret the static `encryptionKey`
	if (!starter.hasProperty(id)) {
		var key = _.isFunction(exports.generator) ? exports.generator(key) : Securely.generateRandomKey();
		starter.setString(id, key);
		encKey = key;
	} else {
		encKey = starter.getString(id);
	}

	return Securely.createProperties({
		identifier: "_" + Ti.App.id + ".data",
		secret: encKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});
}

function installId() {
	if (OS_IOS) return Ti.App.installId;
	if (Ti.App.Properties.hasProperty("uuid")) return Ti.App.Properties.getString("uuid");

	var key = Securely.generateRandomKey();
	Ti.App.Properties.setString("uuid", key);

	return key;
}

/**
 * Public functions
 */

exports.setGenerator = function(fn) {
	exports.generator = _.isFunction(fn) ? fn : null;
};

exports.installId = installId();
