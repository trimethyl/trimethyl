/**
* @module  prop
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.encryptionKey=null] Secret to use in keychain encryption.
 * * @property {Bool} [config.allowSync=true] Whether to sync data with iCloud
 * * @property {String} [config.accessGroup=null] The access group identifier to share data along apps
 */
exports.config = _.extend({
	encryptionKey: null,
	allowSync: true,
	accessGroup: null
}, Alloy.CFG.T ? Alloy.CFG.T.prop : {});

var MODULE_NAME = 'prop';

var Util = require('T/util');
var Securely = Util.requireOrNull('bencoding.securely');

var generator = null;

if (Securely == null) {
	Ti.API.warn(MODULE_NAME + ': you are not including the security module, your auth storage is not secure');
	module.exports = Ti.App.Properties;
} else {
	module.exports = initWithStaticAndDynamicKeys();
}

/**
 * Private functions
 */

function initWithStaticAndDynamicKeys() {
	var stringCrypto = Securely.createStringCrypto();
	var id = Ti.Utils.sha256(Ti.App.id);
	
	var encKey = null;
	
	var starter = Securely.createProperties({
		identifier: Ti.App.id + '.starter',
		secret: exports.config.encryptionKey,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});

	// Saving dynamic key in keychain with key 'Ti.App.id' and secret the static `encryptionKey`
	if (!starter.hasProperty(id)) {
		var key = _.isFunction(generator) ? 
			exports.generator(key) : 
			Securely.generateRandomKey();
		starter.setString(id, key);
		encKey = key;
	} else {
		encKey = starter.getString(id);
	}

	return Securely.createProperties({
		identifier: Ti.App.id,
		secret: encKey,
		accessGroup: exports.config.accessGroup,
		allowSync: exports.config.allowSync,
		debug: !ENV_PRODUCTION
	});
}

/**
 * Public functions
 */

exports.setGenerator = function(fn) {
	exports.generator = _.isFunction(fn) ? fn : null;
};
