/**
 * @class  DB
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Proxy for a single SQLite database access
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.db);
exports.config = config;

var DB = null;

/**
 * Open the `app` database, or return current database instance
 *
 * @singleton
 * @return {Titanium.Database.DB}
 */
function open() {
	if (DB !== null) return DB;

	try {
		DB = Ti.Database.open('app');
	} catch (ex) {
		DB = null;
		Ti.API.error('DB: ERROR', ex);
	}

	return DB;
}
exports.open = open;