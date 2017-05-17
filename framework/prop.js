/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 * * @property {Bool} [config.allowSync=true] Whether to sync data with iCloud
 * * @property {String} [config.method="dynamic"] What method to use for the key, "dynamic" can be synced, "random" cannot
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true,
	method: "dynamic"
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');
var Securely = Util.requireOrNull('bencoding.securely');
$.generator = null;

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your auth storage is not secure");
	module.exports = Ti.App.Properties;
} else {
	if (exports.config.method == "random") module.exports = initWithDynamicKey();
	else module.exports = initWithStaticAndDynamicKeys();
}

/**
 * Private functions
 */

function initWithDynamicKey() {
	var key = scrambleKey(exports.config.encryptionKey);

	return Securely.createProperties({
		secret: key,
		allowSync: false,
		debug: !ENV_PRODUCTION
	});
}

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
		var key = _.isFunction($.generator) ? $.generator(key) : Securely.generateRandomKey();
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

function scrambleKey(key) {
	if (_.isFunction($.generator)) return $.generator(key);
	var stringCrypto = Securely.createStringCrypto();
	key = key + installId();
	key = stringCrypto.AESEncrypt(exports.config.encryptionKey, key);
	return key;
}

function installId() {
	if (OS_IOS) return Ti.App.installId;

	var iid = Ti.Filesystem.getFile(Util.getAppDataDirectory(), 'iid');
	if (iid.exists()) {
		return iid.read().text;
	}

	var key = Securely.generateRandomKey();
	iid.open(Titanium.Filesystem.MODE_WRITE);
	iid.write(key, false);

	return key;
}

/**
 * Public functions
 */

module.exports.setGenerator = function(fn) {
	$.generator = _.isFunction(fn) ? fn : null;
};

module.exports.installId = installId();
