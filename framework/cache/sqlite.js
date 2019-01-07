/**
 * @module  cache/sqlite
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var MODULE_NAME = 'cache.sqlite';

var SQLite = require('T/sqlite');
var Util = require('T/util');

var DB_NAME = 'trimethyl';
var TABLE = 'cachedb';

function getDatabase() {
	var DB = new SQLite(DB_NAME);
	DB.run('CREATE TABLE IF NOT EXISTS ' + TABLE + ' (hash TEXT PRIMARY KEY, expire INTEGER, value BLOB)');
	DB.run('DELETE FROM ' + TABLE + ' WHERE expire < ?', Util.now());
	return DB;
}

/**
 * Get an entry
 * @param  {String} 	hash
 * @return {Ti.Blob}
 */
exports.get = function(hash) {
	var DB = getDatabase();

	var row = DB.row('SELECT * FROM ' + TABLE + ' WHERE hash = ? AND expire >= ? LIMIT 1', hash, Util.now());
	if (row == null) return null;

	return row.value;
};

/**
 * Set a new entry
 * @param {String} 	hash
 * @param {Object} 	value
 * @param {Number} 	ttl
 * @return {Boolean}
 */
exports.set = function(hash, value, ttl) {
	var DB = getDatabase();
	DB.run('INSERT OR REPLACE INTO ' + TABLE + ' (hash, expire, value) VALUES (?, ?, ?)',
		hash,
		Util.fromNow(ttl || 0),
		value
	);
};


/**
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	var DB = getDatabase();
	DB.run('DELETE FROM ' + TABLE + ' WHERE hash = ?', hash);
};

/**
 * Prune all
 */
exports.purge = function() {
	var DB = getDatabase();
	DB.run('DELETE FROM ' + TABLE);
};

/**
 * @return {Number}
 */
exports.getSize = function() {
	var DIR = Util.getDatabaseDirectoryName();
	return require('T/filesystem').getSize(DIR + '/' + DB_NAME + '.sql');
};
