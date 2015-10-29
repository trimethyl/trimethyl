var HTTP = T('http');

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

exports.http_refresh = function() {
	return Q.promise(function(resolve, reject) {
		var a = HTTP.send({
			url: 'http://demo1916598.mockable.io/ttl-unit-test',
			success: function() {
				var b = HTTP.send({
					url: 'http://demo1916598.mockable.io/ttl-unit-test',
					refresh: true,
					success: function() {
						var c = HTTP.send({
							url: 'http://demo1916598.mockable.io/ttl-unit-test',
							success: function() {
								if (a.cachedData.expire == c.cachedData.expire) return reject('Timestamps match');
								resolve();
							}
						});
					}
				});
			}
		});
	});
};
