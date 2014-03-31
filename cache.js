/*

Cache module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {};
var DB = null;

function get(id) {
	if (!DB) {
		console.error("Database cache not open.");
		return false;
	}

	var row = DB.execute('SELECT expire FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) {
		return false;
	}

	var expire = row.field(0) || 0;
	var now = require('util').timestamp();

	if (expire!==-1 && now>expire) {
		return false;
	}

	row = DB.execute('SELECT value FROM cache WHERE id = ? LIMIT 1', id);
	if (!row.isValidRow()) {
		return false;
	}

	return require('util').parseJSON(row.field(0));
}

exports.get = function(id, value, expire) {
	var dbvalue = get(id);
	if (dbvalue) {
		return dbvalue;
	}

	if (!value) return false;
	if (typeof value==='function') value = value();

	set(id, value, expire);
	return value;
};

exports.set = set = function(id, value, expire) {
	if (!DB) {
		console.error("Database cache not open.");
		return false;
	}

	if (expire) {
		expire = require('util').timestamp() + parseInt(expire, 10);
	} else {
		expire = -1;
	}
	DB.execute('INSERT OR REPLACE INTO cache (id, expire, value) VALUES (?,?,?)', id, expire, JSON.stringify(value));
};

exports.init = function(c) {
	config = _.extend(config, c);
	DB = require('db').open();
	if (DB) {
		DB.execute('CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY, expire INTEGER, value TEXT)');
	}
};