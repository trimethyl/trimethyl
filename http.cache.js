/**
 * @class  HTTP.Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Cache helper for HTTP network
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.http ? Alloy.CFG.T.http.cache : {});
exports.config = config;

var DB = null;

/**
 * Write the cache
 * @param  {Object} request  The network request
 * @param  {Object} response The network response
 * @param  {Object} info     The network informations
 */
function set(request, response, info) {
	if (!DB) {
		Ti.API.error("HTTP.Cache: database not open");
		return false;
	}

	DB.execute('INSERT OR REPLACE INTO net (id, expire, creation, content, info) VALUES (?,?,?,?,?)',
		request.hash,
		info.expire,
		require('T/util').timestamp(),
		response.responseData,
		JSON.stringify(info)
		);
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
		Ti.API.error("HTTP.Cache: database not open");
		return false;
	}

	var cacheRow = DB.execute('SELECT expire, creation FROM net WHERE id = ? LIMIT 1', request.hash);
	if (!cacheRow || !cacheRow.isValidRow()) {
		return false;
	}

	var expire = +cacheRow.fieldByName('expire') || 0;
	var now = require('T/util').timestamp();

	if (!bypassExpiration) {
		Ti.API.debug("HTTP.Cache: REQ-["+request.hash+"] cache values are "+expire+"-"+now+" = "+Math.floor((expire-now)/60)+"min");
		if (expire<now) return false;
	}

	cacheRow = DB.execute('SELECT info, content FROM net WHERE id = ? LIMIT 1', request.hash);
	var content = cacheRow.fieldByName('content');
	if (!content) {
		Ti.API.error("HTTP.Cache: REQ-["+request.hash+"] has invalid cache content");
		return false;
	}

	var info = require('T/util').parseJSON(cacheRow.fieldByName('info')) || {};
	if (info.mime=='json') {
		return require('T/util').parseJSON(content);
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
		Ti.API.error("HTTP.Cache: database not open");
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
		Ti.API.error("HTTP.Cache: database not open");
		return false;
	}

	DB.execute('DELETE FROM net WHERE id = ?', hash);
}
exports.del = del;


(function init(){

	DB = require('T/db').open();
	if (DB) {
		DB.execute('CREATE TABLE IF NOT EXISTS net (id TEXT PRIMARY KEY, expire INTEGER, creation INTEGER, content TEXT, info TEXT)');
	}

})();