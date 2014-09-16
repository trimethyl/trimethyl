/**
 * @class  Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Fast cache module using SQLite
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.cache);
exports.config = config;


var DB = null;

function __get(id) {
	if (!DB) {
		Ti.API.error("Cache: database not open.");
		return false;
	}

	var row = DB.execute('SELECT expire FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) return false;

	var expire = row.field(0) || 0;
	var now = require('T/util').timestamp();
	if (expire!==-1 && now>expire) return false;

	row = DB.execute('SELECT value FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) return false;

	return require('T/util').parseJSON(row.field(0));
}

/**
 * Get the property or set if not present
 *
 * @param  {String} id     The unique key
 * @param  {Object|Function} value  Value to set if the property is absent/expired
 * @param  {Number} expire TTL of this property,expressed is seconds from now
 * @return {Mixed}
 */
function get(id, value, expire) {
	var databaseValue = __get(id);
	if (databaseValue) return databaseValue;

	if (!value) return false;
	if (_.isFunction(value)) value = value();

	set(id, value, expire);
	return value;
}
exports.get = get;


/**
 * Set the property
 *
 * @param {String} id     The unique key
 * @param {Mixed} value  Value to set
 * @param {Number} expire TTL of this property, expressed is seconds from now
 */
function set(id, value, expire) {
	if (!DB) {
		Ti.API.error("Cache: database not open.");
		return false;
	}

	if (expire) {
		expire = require('T/util').timestamp() + parseInt(expire, 10);
	} else {
		expire = -1;
	}
	DB.execute('INSERT OR REPLACE INTO cache (id, expire, value) VALUES (?,?,?)', id, expire, JSON.stringify(value));
}
exports.set = set;


(function init(c) {
	DB = require('T/db').open();
	if (DB) {
		DB.execute('CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY, expire INTEGER, value TEXT)');
	}
})();
