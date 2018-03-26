var Q = T('ext/q');

var HTTP = T('http');
var SQLite = T('sqlite');
var Router = T('router');
var Util = T('util');
var Logger = T('logger');
var Dialog = T('dialog');
var Filesystem = T('filesystem');
var Geo = T('geo');
var Auth = T('auth');
var Prop = T('prop');
var Cache = T('cache');

var G = {};

exports.methods = {
	http: {},
	sqlite: {},
	router: {},
	util: {},
	logger: {},
	prop: {},
	filesystem: {},
	cache: {},
	geo: {}
};

exports.methods.http.should_parse_json = function() {
	return Q.promise(function(resolve, reject) {
		HTTP.send({
			url: '/hello',
			success: function(response) {
				if (!_.isObject(response)) return reject('Response is not an object');
				if (response.hello !== 'world') return reject('Response.hello is not "world"');
				resolve();
			}
		});
	});
};

exports.methods.http.ssl_pinning_should_not_affect_other_https = function() {
	return Q.promise(function(resolve, reject) {
		HTTP.send({
			url: 'https://imgix.com',
			success: resolve,
			error: reject
		});
	});
};

exports.methods.http_should_cache = function() {
	return Q.promise(function(resolve, reject) {
		var a = HTTP.send({
			url: '/ttl-unit-test',
			success: function() {
				var b = HTTP.send({
					url: '/ttl-unit-test',
					success: function() {
						if (b.cachedData == null) return reject('Cache is not here');
						resolve();
					}
				});
			}
		});
	});
};

exports.methods.http.should_download = function() {
	return Q.promise(function(resolve, reject) {
		HTTP.download('https://unsplash.it/800/800', 'test.jpg', function(file) {
			if (file == null || !file.exists()) {
				return reject('File not exists');
			}
			resolve();
		}, reject);
	});
};

exports.methods.sqlite.should_open = function() {
	return Q.promise(function(resolve, reject) {
		G.db = new SQLite('test');
		resolve();
	});
};

exports.methods.sqlite.should_execute = function() {
	return Q.promise(function(resolve, reject) {
		G.db.execute('DROP TABLE IF EXISTS x');
		G.db.execute('CREATE TABLE x (id INTEGER PRIMARY KEY, text TEXT)');
		resolve();
	});
};

exports.methods.sqlite.should_insert = function() {
	return Q.promise(function(resolve, reject) {
		G.db.table('x').insert({ id: 1, text: 'trimethyl' }).exec();
		G.db.table('x').insert({ id: 2, text: 'alloy' }).exec();
		resolve();
	});
};

exports.methods.sqlite.should_select_val = function() {
	return Q.promise(function(resolve, reject) {
		var val = G.db.table('x').select('text').where({ id: 1 }).val();
		if (val != 'trimethyl') {
			return reject('Value is not what expected: ' + val);
		}
		resolve();
	});
};

exports.methods.sqlite.should_select_all = function() {
	return Q.promise(function(resolve, reject) {
		var rows = G.db.table('x').select('text').orderBy('id').all();
		if (rows[0].text != 'trimethyl' || rows[1].text != 'alloy') {
			return reject('Values are not what expected');
		}
		resolve();
	});
};

exports.methods.sqlite.should_throw_errors = function() {
	return Q.promise(function(resolve, reject) {
		try {
			G.db.table('notexists').select().all();
			reject();
		} catch (ex) {
			resolve();
		}
	});
};

exports.methods.util.should_build_query = function() {
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

exports.methods.util.should_parse_as_x_callback_url = function() {
	return Q.promise(function(resolve, reject) {
		var actual = Util.parseAsXCallbackURL('trimethyltest://tester:passtest@caffeina:26000/test?first=this&second="that"&third={what:"dunno"}');
		var expected = {
			query: "first=this&second=\"that\"&third={what:\"dunno\"}",
			file: "test",
			directory: "/",
			path: "/test",
			relative: "/test?first=this&second=\"that\"&third={what:\"dunno\"}",
			host: "caffeina",
			port: "26000",
			user: "tester",
			userInfo: "tester:passtest",
			password: "passtest",
			authority: "tester:passtest@caffeina:26000",
			protocol: "trimethyltest",
			source: "trimethyltest://tester:passtest@caffeina:26000/test?first=this&second=\"that\"&third={what:\"dunno\"}",
			queryKey: {
				first: "this",
				second: "\"that\"",
				third: "{what:\"dunno\"}"
			}
		};

		if (actual == null) {
			return reject('Value is null');
		}

		for (var key in expected) {
			if (!_.isEqual(actual[key], expected[key])) {
				return reject('Value property ' + key + ' is not what expected: ' + actual[key]);
			}
		}

		resolve();
	});
};

exports.methods.logger.methods_should_work = function() {
	return Q.promise(function(resolve, reject) {
		try {

			Logger.trace('Single string');
			Logger.info('Multiple', 'Strings');
			Logger.debug('Undefined, null and object', null, undefined, { 0: 'an', 1: 'object' });
			Logger.warn('Objects and array', { first: { type: "animal", name: "tapir" }, second: { type: "mineral", name: "quartz" } }, [1,7,9,0, null]);

			resolve();

		} catch(err) {
			reject(err);
		}
	});
};

exports.methods.filesystem.should_write = function() {
	return Q.promise(function(resolve, reject) {
		var test_file = Ti.Filesystem.getFile(Util.getAppDataDirectory(), 'trimethyl_test_file');
		Filesystem.write({
			file: test_file,
			data: 'test',
			success: resolve,
			error: reject
		});
	});
};

exports.methods.prop.should_getset = function() {
	return Q.promise(function(resolve, reject) {

		Prop.setString('test', 'uno');
		if (Prop.getString('test') != 'uno') {
			return reject('Expected uno, received ' + Prop.getString('test'));
		}

		resolve();
	});
};

exports.methods.prop.should_remove = function() {
	return Q.promise(function(resolve, reject) {

		Prop.setString('test', 'uno');
		Prop.removeProperty('test');

		if (Prop.hasProperty('test')) {
			return reject('Expected property missing');
		}

		if (Prop.getString('test') != null) {
			return reject('Expected null, received', Prop.getString('test'));
		}

		resolve();
	});
};

function cache_driver_test_json(driver) {
	return Q.promise(function(resolve, reject) {
		var _cache = Cache.loadDriver(driver);

		_cache.set('pranzo', JSON.stringify({ pasta: 'carbonara' }), 1);
		var cache_entry = JSON.parse(_cache.get('pranzo'));

		if (cache_entry == null || cache_entry.pasta != 'carbonara') {
			return reject("Received (JSON) ", cache_entry);
		}

		resolve();
	});	
}

function cache_driver_test_blob(driver) {
	return Q.promise(function(resolve, reject) {
		var _cache = Cache.loadDriver(driver);

		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationCacheDirectory, 'pasta.txt');
		file.write('carbonara');
		_cache.set('pranzo_file', file.read(), 1);

		var cache_file_entry = _cache.get('pranzo_file');
		if (cache_file_entry == null || cache_file_entry != 'carbonara') {
			return reject("Received (BLOB) ", cache_file_entry);
		}

		resolve();
	});
}

function cache_driver_test_expire(driver) {
	return Q.promise(function(resolve, reject) {
		var _cache = Cache.loadDriver(driver);

		_cache.set('cena', true, 1);

		setTimeout(function() {
			if (_cache.get('cena') != null) {
				return reject('Expected (JSON) null, received', _cache.get('cena'));
			}

			resolve();
		}, 2000);
	});
}

exports.methods.cache.sqlite_should_work_with_json = function() {
	return cache_driver_test_json('sqlite');
};

exports.methods.cache.sqlite_should_work_with_blob = function() {
	return cache_driver_test_blob('sqlite');
};

exports.methods.cache.sqlite_should_work_expire = function() {
	return cache_driver_test_expire('sqlite');
};

exports.methods.cache.prop_should_work_with_json = function() {
	return cache_driver_test_json('prop');
};

exports.methods.cache.prop_should_work_with_blob = function() {
	return cache_driver_test_blob('prop');
};

exports.methods.cache.prop_should_work_expire = function() {
	return cache_driver_test_expire('prop');
};

exports.methods.geo.geo_should_be_authorized = function() {
	return Q.promise(function(resolve, reject) {
		if (Geo.isAuthorized()) return resolve();
		reject();
	});
};

exports.methods.geo.get_coords_should_work = function() {
	return Q.promise(function(resolve, reject) {
		Geo.getCurrentPosition()
		.then(function(coords) {
			if (coords.latitude && coords.longitude) return resolve();
			reject();
		})
		.catch(reject);
	});
};

exports.methods.geo.geocode_should_work = function() {
	return Q.promise(function(resolve, reject) {
		Geo.geocode({
			address: "2300 Traverwood Dr. Ann Arbor, MI 48105"
		})
		.then(function(res) {
			if (res.latitude && res.longitude) return resolve();
			reject();
		})
		.catch(reject);
	});
};

exports.methods.geo.reversegeocode_should_work = function() {
	return Q.promise(function(resolve, reject) {
		Geo.reverseGeocode({
			latitude: 42.30501176970849,
			longitude: -83.7153608802915
		})
		.then(function(res) {
			if (res.address) return resolve();
			reject();
		})
		.catch(reject);
	});
};

