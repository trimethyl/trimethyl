var HTTP = T('http');
var SQLite = T('sqlite');
var Router = T('router');
var Util = T('util');

var G = {};

exports.http_json_parsing = function() {
	return Q.promise(function(resolve, reject) {
		HTTP.send({
			url: 'http://demo1916598.mockable.io/hello',
			success: function(response) {
				if (!_.isObject(response)) return reject('Response is not an object');
				if (response.hello !== 'world') return reject('Response.hello is not "world"');
				resolve();
			}
		});
	});
};

exports.http_cache = function() {
	return Q.promise(function(resolve, reject) {
		var a = HTTP.send({
			url: 'http://demo1916598.mockable.io/ttl-unit-test',
			success: function() {
				var b = HTTP.send({
					url: 'http://demo1916598.mockable.io/ttl-unit-test',
					success: function() {
						if (b.cachedData == null) return reject('Cache is not here');
						resolve();
					}
				});
			}
		});
	});
};

exports.http_download = function() {
	return Q.promise(function(resolve, reject) {
		HTTP.download('https://unsplash.it/800/800', 'test.jpg', function(file) {
			if (file == null || !file.exists()) return reject('File not exists');
			resolve();
		}, reject);
	});
};

exports.sqlite_open = function() {
	return Q.promise(function(resolve, reject) {
		G.db = new SQLite('test');
		resolve();
	});
};

exports.sqlite_execute = function() {
	return Q.promise(function(resolve, reject) {
		G.db.execute('DROP TABLE IF EXISTS x');
		G.db.execute('CREATE TABLE x (id INTEGER PRIMARY KEY, text TEXT)');
		resolve();
	});
};

exports.sqlite_insert = function() {
	return Q.promise(function(resolve, reject) {
		G.db.table('x').insert({ id: 1, text: 'trimethyl' }).exec();
		G.db.table('x').insert({ id: 2, text: 'alloy' }).exec();
		resolve();
	});
};

exports.sqlite_select_val = function() {
	return Q.promise(function(resolve, reject) {
		var val = G.db.table('x').select('text').where({ id: 1 }).val();
		if (val != 'trimethyl') {
			return reject('Value is not what expected: ' + val);
		}
		resolve();
	});
};

exports.sqlite_select_all = function() {
	return Q.promise(function(resolve, reject) {
		var rows = G.db.table('x').select('text').orderBy('id').all();
		if (rows[0].text != 'trimethyl' || rows[1].text != 'alloy') {
			return reject('Values are not what expected');
		}
		resolve();
	});
};

exports.sqlite_should_throw_errors = function() {
	return Q.promise(function(resolve, reject) {
		try {
			G.db.table('notexists').select().all();
			reject();
		} catch (ex) {
			resolve();
		}
	});
};

exports.routing_base = function() {
	return Q.promise(function(resolve, reject) {
		var timeout = setTimeout(function() { reject(); }, 500);
		Router.on('/test', function() {
			clearTimeout(timeout);
			if (this.data.a === 1) resolve();
		});
		Router.go('/test', { a:1 });
	});
};

exports.util_build_query = function() {
	return Q.promise(function(resolve, reject) {
		var built = Util.buildQuery({
			a: 1,
			b: {
				c: [1,2,3],
				d: 'enco$ded'
			}
		}, '');
		if (built !== 'a=1&b%5Bc%5D%5B%5D=1&b%5Bc%5D%5B%5D=2&b%5Bc%5D%5B%5D=3&b%5Bd%5D=enco%24ded') {
			return reject('Value is not what expected: ' + built);
		}
		resolve();
	});
};
