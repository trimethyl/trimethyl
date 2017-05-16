/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true,
	method: "static"
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');
var Securely = Util.requireOrNull('bencoding.securely');
$.generator = null;

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ": you are not including the security module, your auth storage is not secure");
	module.exports = Ti.App.Properties;
} else {
	module.exports = initWithStaticKey();
}

/**
 * Private functions
 */

function initWithStaticKey() {
	return Securely.createProperties({
		secret: exports.config.encriptionKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION,
	});
}

function initWithDynamicKey() {
	var key = scrambleKey(Ti.App.installId);

	return Securely.createProperties({
		secret: key,
		allowSync: false,
		debug: !ENV_PRODUCTION
	});
}

function initWithStaticAndDynamicKeys() {
	var encKey = null;
	var starter = Securely.createProperties({
		identifier: Ti.App.id + ".starter",
		secret: exports.config.encryptionKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});

	// Saving dynamic key in keychain with key "Ti.App.id" and secret the static `encryptionKey`
	if (!starter.hasProperty(Ti.App.id)) {
		var key = scrambleKey(Securely.generateRandomKey());
		starter.setString(Ti.App.id, key);
		encKey = key;
	} else {
		encKey = starter.getString(Ti.App.id);
	}

	return Securely.createProperties({
		identifier: Ti.App.id + ".data",
		secret: encKey,
		allowSync: false,
		debug: !ENV_PRODUCTION
	});
}

function scrambleKey(key) {
	if (_.isFunction($.generator)) return $.generator(key);
	var stringCrypto = Securely.createStringCrypto();
	key = key + Ti.App.installId + key.split('').reverse().join('');
	key = stringCrypto.AESEncrypt(exports.config.encryptionKey, key);
	return key;
}


/**
 * Public functions
 */

$.setGenerator = function(fn) {
	$.generator = _.isFunction(fn) ? fn : null;
};
