/**
 * @module  cache/prop
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var MODULE_NAME = 'cache.prop';

var Util = require('T/util');

var DIR = Ti.Filesystem.applicationCacheDirectory + 'prop';

var purged = false;

var storage_memory = null;

function initStorage() {
	if (storage_memory != null) return;

	Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory).createDirectory();
	Ti.Filesystem.getFile(DIR).createDirectory();

	storage_memory = Ti.App.Properties.getObject('T_cache', {});

	if (purged === false) {
		purged = true;
		_.each(storage_memory, function(hash, o) {
			if (o.expire > Util.now()) {
				remove(hash, { write: false });
			}
		});
	}
}

function writeStorage() {
	if (storage_memory == null) {
		throw new Error(MODULE_NAME + ': uninitialized storage');
	}
	Ti.App.Properties.setObject('T_cache', storage_memory);
}

/**
 * Get an entry
 * @param  {String} 	hash
 * @return {Ti.Blob}
 */
exports.get = function(hash) {
	initStorage();

	var element = storage_memory[hash];
	if (element == null) return null;

	var expire = element.expire << 0;
	if (element.expire < Util.now()) {
		exports.remove(hash);
		return null;
	}

	var file = Ti.Filesystem.getFile(DIR, hash);
	if (false === file.exists()) {
		exports.remove(hash);
		return null;
	}

	return file.read();
};

/**
 * Set a new entry
 * @param {String} 	hash
 * @param {Object} 	value
 * @param {Number} 	ttl
 * @param {Object} 	info
 */
exports.set = function(hash, value, ttl, info) {
	initStorage();
	storage_memory[hash] = { 
		expire: Util.fromNow(ttl || 0), 
		info: info
	};
	Ti.Filesystem.getFile(DIR, hash).write(value);
	writeStorage();
};


/**
 * Remove an entry
 * @param  {String} 	hash
 */
exports.remove = function(hash) {
	initStorage();	
	delete storage_memory[hash];
	Ti.Filesystem.getFile(DIR, hash).deleteFile();
	writeStorage();
};

/**
 * Prune all
 */
exports.purge = function() {
	initStorage();
	storage_memory = {};
	Ti.Filesystem.getFile(DIR).deleteDirectory(true);
	Ti.Filesystem.getFile(DIR).createDirectory();
	writeStorage();
};

/**
 * @return {Number}
 */
exports.getSize = function() {
	return require('T/filesystem').getSize(DIR);
};