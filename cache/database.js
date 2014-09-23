/**
 * @class  Cache.Database
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Fast cache module using SQLite
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.cache ? Alloy.CFG.T.cache.database : {});
exports.config = config;


var Util = require('T/util');
var DB = null;

/**
 * Get an entry
 * @param  {String} hash [description]
 * @return {Object}
 */
function get(hash) {
	var row = DB.execute('SELECT expire, value, info FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row.isValidRow() === false) return;

	var expire = parseInt(row.fieldByName('expire'), 10);
	if (expire !== -1 && Util.now() > expire) return;

	return {
		expire: expire,
		value: row.fieldByName('value'),
		info: Util.parseJSON(row.fieldByName('info'))
	};
}
exports.get = get;

/**
 * Set a new entry
 * @param {String} 	hash
 * @param {Mixed} 	value
 * @param {Integer} 	ttl
 * @param {Object} 	info
 */
function set(hash, value, ttl, info) {
	var expire = ttl != null ? Util.fromnow(ttl) : -1;
	var q = 'INSERT OR REPLACE INTO cache (hash, expire, value, info) VALUES (?, ?, ?, ?)';
	DB.execute(q, hash, expire, value, JSON.stringify(info));
}
exports.set = set;

/**
 * Prune all
 */
function prune() {
	return DB.execute('DELETE FROM cache WHERE 1');
}
exports.prune = prune;

/**
 * Remove an entry
 * @param  {String} 	hash
 */
function remove(hash) {
	DB.execute('DELETE FROM cache WHERE hash = ?', hash);
}
exports.remove = remove;


/*
Init
*/

DB = require('T/db').open();
DB.execute('CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, expire INTEGER, value TEXT, info TEXT)');
