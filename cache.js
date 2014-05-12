/*

Cache module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({}, Alloy.CFG.cache);
var $ = null;

function get(id) {
	if (!$) {
		Ti.API.error("Cache: database not open.");
		return false;
	}

	var row = $.execute('SELECT expire FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) {
		return false;
	}

	var expire = row.field(0) || 0;
	var now = require('util').timestamp();

	if (expire!==-1 && now>expire) {
		return false;
	}

	row = $.execute('SELECT value FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) {
		return false;
	}

	return require('util').parseJSON(row.field(0));
}

exports.get = function(id, value, expire) {
	var $value = get(id);
	if ($value) {
		return $value;
	}

	if (!value) return false;
	if (typeof value==='function') value = value();

	set(id, value, expire);
	return value;
};

function set(id, value, expire) {
	if (!$) {
		Ti.API.error("Cache: database not open.");
		return false;
	}

	if (expire) {
		expire = require('util').timestamp() + parseInt(expire, 10);
	} else {
		expire = -1;
	}
	$.execute('INSERT OR REPLACE INTO cache (id, expire, value) VALUES (?,?,?)', id, expire, JSON.stringify(value));
}
exports.set = set;

(function init(c) {
	$ = require('$').open();
	if ($) {
		$.execute('CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY, expire INTEGER, value TEXT)');
	}
})();