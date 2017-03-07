/**
* @module  db
* @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
*/

/**
 * * @property {String} [config.password=null] Password used to encrypt the database. If a password is supplied, the database will be encrypted
 */
exports.config = _.extend({
	password: null,
}, Alloy.CFG.T ? Alloy.CFG.T.db : {});

var MODULE_NAME = 'db';

var Util = require('T/util');

if (exports.config.password) {
	var EncDatabase = Util.requireOrNull('appcelerator.encrypteddatabase');
	if (EncDatabase != null) {
		EncDatabase.password = exports.config.password;
		module.exports = EncDatabase;
	} else {
		Ti.API.warn(MODULE_NAME + ": you are not including the appcelerator.encrypteddatabase module, your database  is not secure. Falling back to Ti.Database");
		module.exports = Ti.Database;
	}
} else {
	module.exports = Ti.Database;
}