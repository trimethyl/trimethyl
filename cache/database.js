/**
 * @class  Cache.Database
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, (Alloy.CFG.T && Alloy.CFG.T.cache) ? Alloy.CFG.T.cache.database : {});
exports.config = config;

var SQLite = require('T/sqlite');
var Util = require('T/util');

/**
 * @method get
 * Get an entry
 * @param  {String} hash [description]
 * @return {Object}
 */
exports.get = function(hash) {
	var row = DB.row('SELECT expire, value, info FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row === null) return null;

	var expire = parseInt(row.expire, 10);
	if (expire !== -1 && Util.now() > expire) return null;

	return {
		expire: expire,
		value: row.value,
		info: Util.parseJSON(row.info)
	};
};

/**
 * @method set
 * Set a new entry
 * @param {String} 	hash
 * @param {Mixed} 	value
 * @param {Number} 	ttl
 * @param {Object} 	info
 */
exports.set = function(hash, value, ttl, info) {
	DB.execute('INSERT OR REPLACE INTO cache (hash, expire, value, info) VALUES (?, ?, ?, ?)',
	hash, ttl != null ? Util.fromNow(ttl) : -1, value, JSON.stringify(info));
};


/**
 * @method remove
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	DB.execute('DELETE FROM cache WHERE hash = ?', hash);
};

/**
 * @method purge
 * Prune all
 */
exports.purge = function() {
	return DB.execute('DELETE FROM cache WHERE 1');
};

/**
 * @method getSize
 * @return {Number}
 */
exports.getSize = function() {
	return DB.db.file.size;
};


/*
Init
*/

var DB = new SQLite('app');
DB.execute('CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, expire INTEGER, value TEXT, info TEXT)');
