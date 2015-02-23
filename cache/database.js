/**
 * @class  	Cache.Database
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


var SQLite = require('T/sqlite');
var Util = require('T/util');


/**
 * @method get
 * Get an entry
 * @param  {String} hash [description]
 * @return {Ti.Blob}
 */
exports.get = function(hash) {
	var row = DB.row('SELECT expire, info FROM cache WHERE hash = ? LIMIT 1', hash);
	if (row == null) return null;

	var expire = row.expire << 0;
	if (expire !== -1 && Util.now() > expire) return null;

	console.log(hash);

	var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, hash);
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
	Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, hash).write(value);
};


/**
 * @method remove
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	DB.execute('DELETE FROM cache WHERE hash = ?', hash);
	Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, hash).deleteFile();
};

/**
 * @method purge
 * Prune all
 */
exports.purge = function() {
	DB.execute('DELETE FROM cache WHERE 1');
	Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).deleteDirectory(true);
};

/**
 * @method getSize
 * @return {Number}
 */
exports.getSize = function() {
	return Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).size;
};


/*
Init
*/

var DB = new SQLite('app');
DB.execute('CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, expire INTEGER, info TEXT)');
