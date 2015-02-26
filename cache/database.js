/**
 * @class  	Cache.Database
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var SQLite = require('T/sqlite');
var Util = require('T/util');

var DIR = Ti.Filesystem.applicationCacheDirectory + 'database';
Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).createDirectory();
Ti.Filesystem.getFile(DIR).createDirectory();

/**
 * @method get
 * Get an entry
 * @param  {String} hash
 * @param  {Boolean} bypassExpire
 * @return {Ti.Blob}
 */
exports.get = function(hash, bypassExpire) {
	var row = DB.row('SELECT expire, info FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row == null) return null;

	if (bypassExpire === true) {
		Ti.API.debug('Cache: Get bypassed');
	}

	var expire = row.expire << 0;
	if (bypassExpire !== true && expire !== -1 && Util.now() > expire) return null;

	var file = Ti.Filesystem.getFile(DIR, hash);
	if (!file.exists()) return null;

	return {
		value: file.read(),
		expire: expire,
		info: Util.parseJSON(row.info)
	};
};

/**
 * @method set
 * Set a new entry
 * @param {String} 	hash
 * @param {Object} 	value
 * @param {Number} 	ttl
 * @param {Object} 	info
 */
exports.set = function(hash, value, ttl, info) {
	info = JSON.stringify(info || {});
	if (_.isObject(value) || _.isArray(value)) value = JSON.stringify(value);

	var expire = -1;
	if (ttl != null) {
		expire = Util.fromNow(ttl);
	}

	DB.execute('INSERT OR REPLACE INTO cache (hash, expire, info) VALUES (?, ?, ?)', hash, expire, info);
	Ti.Filesystem.getFile(DIR, hash).write(value);
};


/**
 * @method remove
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	DB.execute('DELETE FROM cache WHERE hash = ?', hash);
	Ti.Filesystem.getFile(DIR, hash).deleteFile();
};

/**
 * @method purge
 * Prune all
 */
exports.purge = function() {
	DB.execute('DELETE FROM cache WHERE 1');
	Ti.Filesystem.getFile(DIR).deleteDirectory(true);
	Ti.Filesystem.getFile(DIR).createDirectory();
};

/**
 * @method getSize
 * @return {Number}
 */
exports.getSize = function() {
	return T('filesystem').getSize(DIR);
};


/*
Init
*/

var DB = new SQLite('app');
DB.execute('CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, expire INTEGER, info TEXT)');
