/**
 * @class  Net.Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Network Cache module
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.net ? Alloy.CFG.net.cache : {});
exports.config = config;

var DB = null;


/**
 * Write the cache
 * @param  {Object} request  The network request
 * @param  {[type]} response The network response
 * @param  {[type]} info     [The network informations
 */
function set(request, response, info) {
	if (!DB) {
		Ti.API.error("Net.Cache: REQ-["+request.hash+"] database not open.");
		return false;
	}

	DB.execute('INSERT OR REPLACE INTO net (id, expire, creation, content, info) VALUES (?,?,?,?,?)',
		request.hash,
		info.expire,
		require('util').timestamp(),
		response.responseData,
		JSON.stringify(info)
		);

	if (ENV_DEVELOPMENT) {
		Ti.API.debug("Net.Cache: REQ-["+request.hash+"] cache written successfully.");
	}
}
exports.set = set;


/**
 * Get the associated cache to that request
 * @param  {Object} request          		The network request
 * @param  {Boolean} [bypassExpiration] 	Control if bypassing the expiration check
 * @return {Object}
 */
function get(request, bypassExpiration) {
	if (!DB) {
		Ti.API.error("Net.Cache: REQ-["+request.hash+"] database not open.");
		return false;
	}

	if (request.refresh || request.cache===false) {
		if (ENV_DEVELOPMENT) {
			Ti.API.debug("Net.Cache: REQ-["+request.hash+"] cache forced to refresh");
		}
		return false;
	}

	var cacheRow = DB.execute('SELECT expire, creation FROM net WHERE id = ? LIMIT 1', request.hash);
	if (!cacheRow || !cacheRow.isValidRow()) {
		Ti.API.debug("Net.Cache: REQ-["+request.hash+"] cache not found");
		return false;
	}

	var expire = +cacheRow.fieldByName('expire') || 0;
	var creation = +cacheRow.fieldByName('creation') || 0;
	var now = require('util').timestamp();

	if (!bypassExpiration) {
		if (ENV_DEVELOPMENT) {
			Ti.API.debug("Net.Cache: REQ-["+request.hash+"] cache values are "+expire+"-"+now+" = "+((expire-now)/60)+"min");
		}
		if (expire<now) {
			return false;
		}
	}

	var cache = DB.execute('SELECT info, content FROM net WHERE id = ? LIMIT 1', request.hash);
	var content = cache.fieldByName('content');
	if (!content) {
		Ti.API.error("Net.Cache: REQ-["+request.hash+"] has invalid cache content");
		return false;
	}

	var info = require('util').parseJSON(cache.fieldByName('info')) || {};
	if (info && info.mime=='json') {
		return require('util').parseJSON(content);
	} else {
		return content;
	}
}
exports.get = get;


/**
 * Reset all cache
 */
function reset() {
	if (!DB) {
		Ti.API.error("Net.Cache: REQ-["+request.hash+"] database not open.");
		return false;
	}

	DB.execute('DELETE FROM net');
}
exports.reset = reset;


/**
 * Delete the cache entry for the passed request
 * @param  {String|Object} request [description]
 */
function del(hash) {
	if (!DB) {
		Ti.API.error("Net.Cache: REQ-["+request.hash+"] database not open.");
		return false;
	}

	DB.execute('DELETE FROM net WHERE id = ?', hash);
}
exports.del = del;


(function init(){

	DB = require('db').open();
	if (DB) {
		DB.execute('CREATE TABLE IF NOT EXISTS net (id TEXT PRIMARY KEY, expire INTEGER, creation INTEGER, content TEXT, info TEXT)');
	}

})();