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
var Util = require('T/util');

function getFromDB(hash) {
	if (DB === null) {
		Ti.API.error('Cache: database not open.');
		return;
	}

	var row = DB.execute('SELECT expire FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row.isValidRow() === false) return;

	var expire = row.field(0) || 0, now = Util.now();
	if (expire !== -1 && now > expire) return;

	row = DB.execute('SELECT value FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row.isValidRow() === false) return;

	return Util.parseJSON(row.field(0));
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
	if (databaseValue != null) {
		return databaseValue;
	}

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
 * @param {String} 	hash     The unique key
 * @param {Mixed} 	value  	Value to set
 * @param {Number} 	ttl 		TTL of this property, expressed is seconds from now
 */
function set(hash, value, ttl) {
	if (DB === null) {
		Ti.API.error('Cache: database not open.');
		return false;
	}

	DB.execute('INSERT OR REPLACE INTO cache (hash, expire, value) VALUES (?,?,?)',
		hash,
		ttl ? Util.fromnow(ttl * 1000) : -1,
		JSON.stringify(value)
	);
}
exports.set = set;

/**
 * Prune all database
 *
 * @return {Boolean}
 */
function prune() {
	if (DB === null) {
		Ti.API.error('Cache: database not open.');
		return false;
	}

	return DB.execute('DELETE FROM cache WHERE 1');
}
exports.prune = prune;


/**
 * Delete the cache entry for the passed request
 * @param  {String|Object} request [description]
 */
function remove(hash) {
	if (DB === null) {
		Ti.API.error('Cache: database not open');
		return false;
	}

	DB.execute('DELETE FROM cache WHERE hash = ?', hash);
}
exports.remove = remove;


(function init() {

	DB = require('T/db').open();
	if (DB !== null) {
		DB.execute('CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, expire INTEGER, value TEXT)');
	}

})();
