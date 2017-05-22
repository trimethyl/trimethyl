/**
 * @module  cache/database
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var SQLite = require('T/sqlite');
var Util = require('T/util');

var DIR = Ti.Filesystem.applicationCacheDirectory + 'database';
var TABLE = 'cachedb';

var purged = false;

function getDatabase() {
	Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).createDirectory();
	Ti.Filesystem.getFile(DIR).createDirectory();

	var DB = new SQLite('app');
	DB.run('CREATE TABLE IF NOT EXISTS ' + TABLE + ' (hash TEXT PRIMARY KEY, expire INTEGER, info TEXT)');

	// Delete oldest keys
	if (purged == false) {
		purged = true;

		DB.list('SELECT hash FROM ' + TABLE + ' WHERE expire < ' + Util.now()).forEach(function(h) {
			Ti.API.trace('Cache: removing expired key ' + h);
			exports.remove(h);
		});
	}

	return DB;
}

/**
 * Get an entry
 * @param  {String} 	hash
 * @return {Ti.Blob}
 */
exports.get = function(hash) {
	var DB = getDatabase();

	var row = DB.row('SELECT expire, info FROM ' + TABLE + ' WHERE hash = ? LIMIT 1', hash);
	if (row == null) return null;

	var expire = row.expire << 0;
	if (Util.now() > expire) return null;

	var file = Ti.Filesystem.getFile(DIR, hash);
	if (!file.exists()) return null;

	return {
		value: file.read(),
		expire: expire,
		info: Util.parseJSON(row.info)
	};
};

/**
 * Set a new entry
 * @param {String} 	hash
 * @param {Object} 	value
 * @param {Number} 	ttl
 * @param {Object} 	info
 */
exports.set = function(hash, value, ttl, info) {
	var DB = getDatabase();
	
	info = JSON.stringify(info || {});
	if (_.isObject(value) || _.isArray(value)) value = JSON.stringify(value);

	var expire = Util.fromNow(ttl || 0);

	DB.run('INSERT OR REPLACE INTO ' + TABLE + ' (hash, expire, info) VALUES (?, ?, ?)', hash, expire, info);
	Ti.Filesystem.getFile(DIR, hash).write(value);
};


/**
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	var DB = getDatabase();
	
	DB.run('DELETE FROM ' + TABLE + ' WHERE hash = ?', hash);
	Ti.Filesystem.getFile(DIR, hash).deleteFile();
};

/**
 * Prune all
 */
exports.purge = function() {
	var DB = getDatabase();
	
	DB.run('DELETE FROM ' + TABLE + ' WHERE 1');
	Ti.Filesystem.getFile(DIR).deleteDirectory(true);
	Ti.Filesystem.getFile(DIR).createDirectory();
};

/**
 * @return {Number}
 */
exports.getSize = function() {
	return require('T/filesystem').getSize(DIR);
};