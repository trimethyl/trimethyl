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

function getFromDB(id) {
	if (DB === null) {
		Ti.API.error('Cache: database not open.');
		return false;
	}

	var row = DB.execute('SELECT expire FROM cache WHERE id = ? LIMIT 1', id);
	if (row.isValidRow() === false) return false;

	var expire = row.field(0) || 0;
	var now = require('T/util').timestamp();
	if (expire!==-1 && now > expire) return false;

	row = DB.execute('SELECT value FROM cache WHERE id = ? LIMIT 1', id);
	if (row.isValidRow() === false) return false;

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
	var databaseValue = getFromDB(id);
	if (databaseValue !== false) return databaseValue;

	// Parse value to set
	if (_.isFunction(value)) value = value();
	if (value == null) return;

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
	if (DB === null) {
		Ti.API.error('Cache: database not open.');
		return false;
	}

	var expireTs = expire ? require('T/util').fromnow(expire) : -1;
	DB.execute('INSERT OR REPLACE INTO cache (id, expire, value) VALUES (?,?,?)', id, expireTs, JSON.stringify(value));
}
exports.set = set;


(function init() {

	DB = require('T/db').open();
	if (DB !== null) {
		DB.execute('CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY, expire INTEGER, value TEXT)');
	}

})();
