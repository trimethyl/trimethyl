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

/**
 * Open the `app` database, or return current database instance
 *
 * @singleton
 * @return {Titanium.Database.DB}
 */
function open() {
	return _.memoize(function() {
		return Ti.Database.open('app');
	});
}
exports.open = open;