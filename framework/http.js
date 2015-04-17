/**
 * @class  	HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String}  config.base The base URL of the API
 * @property {Number}  [config.timeout=10000] Global timeout for the reques. after this value (express in milliseconds) the requests throw an error.
 * @property {Object}  [config.headers={}] Global headers for all requests.
 * @property {Object}  [config.useCache=true] Global cache flag.
 * @property {Boolean} [config.errorAlert=true] Global error alert handling.
 * @property {Boolean} [config.log=false]
 * @property {Boolean} [config.logResponse=false]
 * @property {Boolean} [config.bypassExpireWhenOffline=true] Bypass the check of expiration cache when Internet is offline.
 */
exports.config = _.extend({
	base: '',
	timeout: 10000,
	errorAlert: true,
	headers: {},
	useCache: true,
	log: false,
	logResponse: false,
	bypassExpireWhenOffline: true
}, Alloy.CFG.T ? Alloy.CFG.T.http : {});

var Event = require('T/event');
var Util = require('T/util');
var Cache = require('T/cache');
var Q = require('T/ext/q');

function extractHTTPText(data, info) {
	if (info != null && data != null) {
		if (info.format === 'json') {
			return Util.parseJSON(data);
		}
	}
	return data;
}

function HTTPRequest(opt) {
	var self = this;
	if (opt.url == null) {
		throw new Error('HTTP.Request: URL not set');
	}

	this.opt = opt;

	// if the url is not matching a protocol, assign the base URL
	if (/\:\/\//.test(opt.url)) {
		this.url = opt.url;
	} else {
		this.url = exports.config.base.replace(/\/$/, '') + '/' + opt.url.replace(/^\//, '');
	}

	this.method = opt.method != null ? opt.method.toUpperCase() : 'GET';
	this.headers = _.extend({}, HTTP.getHeaders(), opt.headers);
	this.timeout = opt.timeout != null ? opt.timeout : exports.config.timeout;

	// Rebuild the URL if is a GET and there's data
	if (opt.data != null) {
		if (this.method === 'GET' && _.isObject(opt.data)) {
			var exQuery = /\?.*/.test(this.url);
			this.url = this.url + Util.buildQuery(opt.data, exQuery ? '&' : '?');
		} else {
			this.data = opt.data;
		}
	}

	this.hash = this._calculateHash();
	this.uniqueId = HTTP.getUniqueId();

	// Fill the defer, we will manage the callbacks through it
	this.defer = Q.defer();
	this.defer.promise.then(function() { self._onSuccess.apply(self, arguments); });
	this.defer.promise.fail(function() { self._onError.apply(self, arguments); });

	if (exports.config.log === true) {
		Ti.API.debug('HTTP: <' + this.uniqueId + '> created [' + this.getDebugString() + ']');
	}
}

HTTPRequest.prototype.toString = function() {
	return this.hash;
};

HTTPRequest.prototype.getDebugString = function() {
	return this.method + ' ' + this.url + (this.data ? ' ' + JSON.stringify(this.data) : '');
};

HTTPRequest.prototype._maybeCacheResponse = function(data) {
	if (exports.config.useCache === false || this.opt.cache === false) return;
	if (this.method !== 'GET') return;

	if (this.responseInfo.ttl <= 0) {
		if (exports.config.log === true) {
			Ti.API.debug('HTTP: <' + this.uniqueId + '> is uncachable due TTL <= 0');
		}
		return;
	}

	Cache.set(this.hash, data, this.responseInfo.ttl, this.responseInfo);
	if (exports.config.log === true) {
		Ti.API.debug('HTTP: <' + this.uniqueId + '> has been cached successfully for <' + this.responseInfo.ttl + 's>');
	}
};

HTTPRequest.prototype.getCachedResponse = function() {
	if (exports.config.useCache === false) return null;
	if (this.opt.cache === false || this.opt.refresh === true) return null;
	if (this.method !== 'GET') return null;

	var bypass = exports.config.bypassExpireWhenOffline && !Ti.Network.online;
	var cachedData = Cache.get(this.hash, bypass);
	if (cachedData == null) return null;

	if (exports.config.log === true) {
		Ti.API.debug('HTTP: <' + this.uniqueId + '> cache hit up to ' + (cachedData.expire-Util.now()) + 's');
	}

	if (cachedData.info.format === 'blob') {
		return cachedData.value;
	} else {
		return extractHTTPText(cachedData.value.text, cachedData.info);
	}
};

HTTPRequest.prototype._getResponseInfo = function() {
	if (this.client == null || this.client.readyState <= 1) {
		return {
			broken: true
		};
	}

	var headers = {
		Expires: this.client.getResponseHeader('Expires'),
		ContentType: this.client.getResponseHeader('Content-Type'),
		TTL: this.client.getResponseHeader('X-Cache-Ttl')
	};

	var info = {
		format: 'blob',
		ttl: 0
	};

	if (this.client.responseText != null) {
		info.format = 'text';
		if (/application\/json/.test(headers.ContentType)) info.format = 'json';
	}

	// Always prefer X-Cache-Ttl over Expires
	if (headers.TTL != null) {
		info.ttl = headers.TTL;
	} else if (headers.Expires != null) {
		info.ttl = Util.timestamp(headers.Expires) - Util.now();
	}

	// Override
	if (this.opt.format != null) info.format = this.opt.format;
	if (this.opt.ttl != null) info.ttl = this.opt.ttl;

	return info;
};

HTTPRequest.prototype._onError = function(err) {
	var self = this;
	Ti.API.error('HTTP: <' + this.uniqueId + '>', err);

	if (exports.config.errorAlert && this.opt.errorAlert !== false) {
		Util.errorAlert(err, function() {
			if (_.isFunction(self.opt.error)) self.opt.error(err);
		});
		return;
	}

	if (_.isFunction(self.opt.error)) self.opt.error(err);
	if (_.isFunction(this.opt.complete)) this.opt.complete(e);
};

HTTPRequest.prototype._onSuccess = function() {
	if (exports.config.logResponse === true) {
		Ti.API.trace('HTTP: <' + this.uniqueId + '>', arguments[0]);
	}

	if (_.isFunction(this.opt.success)) this.opt.success.apply(this, arguments);
	if (_.isFunction(this.opt.complete)) this.opt.complete.apply(this, arguments);
};

HTTPRequest.prototype._onComplete = function(e) {
	this.endTime = Date.now();
	HTTP.removeFromQueue(this);

	// Fire the global event
	if (this.opt.silent !== true) {
		Event.trigger('http.end', {
			hash: this.hash,
			eventName: this.opt.eventName
		});
	}

	this.responseInfo = this._getResponseInfo();

	// If the readyState is not DONE, trigger error, because
	// client.onload is the function to be called upon a SUCCESSFULL response.
	if (this.responseInfo.broken) {
		this.defer.reject({
			broken: true
		});
		return;
	}

	var data = null;
	if (this.opt.format === 'blob') {
		data = this.client.responseData;
	} else {
		data = extractHTTPText(this.client.responseText, this.responseInfo);
	}

	if (e.success) {
		if (exports.config.log === true) {
			Ti.API.debug('HTTP: <' + this.uniqueId + '> response success (in ' + (this.endTime-this.startTime) + 'ms)');
		}
		this._maybeCacheResponse(data);

		this.defer.resolve(data);

	} else {
		this.defer.reject({
			message: (this.opt.format === 'blob') ? null : Util.getErrorMessage(data),
			error: e.error,
			code: this.client.status,
			response: data
		});
	}

};

HTTPRequest.prototype._calculateHash = function() {
	var hash = this.url + Util.hashJavascriptObject(this.data) + Util.hashJavascriptObject(this.headers);
	return 'http_' + Ti.Utils.md5HexDigest(hash);
};

HTTPRequest.prototype.send = function() {
	var self = this;

	this.client = Ti.Network.createHTTPClient({
		timeout: this.timeout,
		cache: false,
	});

	this.client.onload = this.client.onerror = function(e) { self._onComplete(e); };

	// Add this request to the queue
	HTTP.addToQueue(this);

	if (this.opt.silent !== true) {
		Event.trigger('http.start', {
			hash: this.hash,
			eventName: this.opt.eventName
		});
	}

	// Progress callbacks
	if (_.isFunction(this.opt.ondatastream)) this.client.ondatastream = this.opt.ondatastream;
	if (_.isFunction(this.opt.ondatasend)) this.client.ondatasend = this.opt.ondatasend;

	// Set headers
	this.client.open(this.method, this.url);
	_.each(this.headers, function(h, k) {
		this.client.setRequestHeader(k, h);
	});

	// Send the request over Internet
	this.startTime = Date.now();
	if (this.data != null) {
		this.client.send(this.data);
	} else {
		this.client.send();
	}
};

HTTPRequest.prototype.resolve = function() {
	var cache = this.getCachedResponse();
	if (cache != null) {
		this.defer.resolve(cache);
	} else {

		if (Ti.Network.online) {

			if (exports.config.log === true) {
				Ti.API.debug('HTTP: <' + this.uniqueId + '> sending request...');
			}
			this.send();

		} else {

			Event.trigger('http.offline');

			this.defer.reject({
				offline: true,
				message: L('network_offline', 'Check your connectivity.')
			});

		}
	}
};

HTTPRequest.prototype.abort = function() {
	if (this.client != null) {
		this.client.abort();
		Ti.API.debug('HTTP: <' + this.uniqueId + '> aborted!');
	}
};


HTTPRequest.prototype.success = HTTPRequest.prototype.then = function(func) {
	this.defer.promise.then(func);
	return this;
};

HTTPRequest.prototype.error = HTTPRequest.prototype.fail = function(func) {
	this.defer.promise.fail(func);
	return this;
};

HTTPRequest.prototype.complete = HTTPRequest.prototype.fin = function(func) {
	this.defer.promise.fin(func);
	return this;
};

HTTPRequest.prototype.getPromise = function() {
	return this.defer.promise;
};


/**
 * @method event
 */
exports.event = function(name, cb) {
	Event.on('http.' + name, cb);
};

/**
 * @method getUniqueId
 * @return {String}
 */
var __uniqueId = 0;
exports.getUniqueId = function() {
	return __uniqueId++;
};

var headers = _.clone(exports.config.headers);

/**
 * @method getHeaders
 * @return {Object}
 */
exports.getHeaders = function() {
	return headers;
};

/**
 * @method addHeader
 * Add a global header for all requests
 * @param {String} key 		The header key
 * @param {String} value 	The header value
 */
exports.addHeader = function(key, value) {
	headers[key] = value;
};

/**
 * @method removeHeader
 * Remove a global header
 * @param {String} key 		The header key
 */
exports.removeHeader = function(key) {
	delete headers[key];
};

/**
 * @method resetHeaders
 * Reset all globals headers
 */
exports.resetHeaders = function() {
	headers = {};
};


var queue = [];

/**
 * @method isQueueEmpty
 * Check if the requests queue is empty
 * @return {Boolean}
 */
exports.isQueueEmpty = function(){
	return _.isEmpty(queue);
};

/**
 * @method getQueue
 * Get the current requests queue
 * @return {Array}
 */
exports.getQueue = function(){
	return queue;
};

/**
 * @method addToQueue
 * Add a request to queue
 * @param {HTTP.Request} request
 */
exports.addToQueue = function(request) {
	queue[request.hash] = request;
};

/**
 * @method removeFromQueue
 * Remove a request from queue
 */
exports.removeFromQueue = function(request) {
	delete queue[request.hash];
};


/**
 * @method resetCookies
 * Reset the cookies for all requests
 */
exports.resetCookies = function() {
	Ti.Network.createHTTPClient().clearCookies(exports.config.base);
};


/**
 * The main function of the module.
 *
 * Create an HTTP.Request and resolve it
 *
 * @param  {Object}	 opt 		The request dictionary
 * * * **url**: The endpoint URL
 * * **method**: The HTTP method to use (GET|POST|PUT|PATCH|..)
 * * **headers**: An Object key-value of additional headers
 * * **timeout**: Timeout after stopping the request and triggering an error
 * * **cache**: Set to false to disable the cache
 * * **success**: The success callback
 * * **error**: The error callback
 * * **format**: Override the format for that request (like `json`)
 * * **ttl**: Override the TTL seconds for the cache
 * @return {HTTP.Request}
 */
function send(opt) {
	var request = new HTTPRequest(opt);
	request.resolve();
	return request;
}
exports.send = send;


/**
 * @method get
 * Make a GET request to that URL
 * @param  {String}   	url The endpoint url
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error Error callback
 * @return {HTTP.Request}
 */
exports.get = function(url, success, error) {
	return send({
		url: url,
		method: 'GET',
		success: success,
		error: error
	});
};


/**
 * @method post
 * Make a POST request to that URL
 * @param  {String}   	url 		The endpoint url
 * @param  {Object}   	data 		The data
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error 	Error callback
 * @return {HTTP.Request}
 */
exports.post = function(url, data, success, error) {
	return send({
		url: url,
		method: 'POST',
		data: data,
		success: success,
		error: error
	});
};


/**
 * @method  getJSON
 * Make a GET request to that url with that data and setting the format forced to JSON
 * @param  {String}   	url 		The endpoint url
 * @param  {Object}   	data 		The data
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error 	Error callback
 * @return {HTTP.Request}
 */
exports.getJSON = function(url, data, success, error) {
	return send({
		url: url,
		data: data,
		method: 'GET',
		format: 'json',
		success: success,
		error: error
	});
};


/**
 * @method  postJSON
 * Make a POST request to that url with that data and setting the format forced to JSON
 * @param  {String}   	url 			The endpoint url
 * @param  {Object}   	data 			The data
 * @param  {Function} 	success  	Success callback
 * @param  {Function} 	error 		Error callback
 * @return {HTTP.Request}
 */
exports.postJSON = function(url, data, success, error) {
	return send({
		url: url,
		data: data,
		method: 'POST',
		format: 'json',
		success: success,
		error: error
	});
};


/**
 * @method download
 * @param  {String}  			url  				The url
 * @param  {Object}  			filename  		File name or `Ti.File`
 * @param  {Function}  			success  		Success callback
 * @param  {Function} 			error  			Error callback
 * @param  {Function}  			ondatastream  	Progress callback
 * @return {HTTP.Request}
 */
exports.download = function(url, file, success, error, ondatastream) {
	return send({
		url: url,
		cache: false,
		refresh: true,
		format: 'blob',
		error: error,
		ondatastream: ondatastream,
	}).success(function(data) {
		var fileStream = null;
		if (file.nativePath) {
			fileStream = file;
		} else {
			var APP_DATA_DIR = Util.getAppDataDirectory();
			Ti.Filesystem.getFile(APP_DATA_DIR).createDirectory();
			fileStream = Ti.Filesystem.getFile(APP_DATA_DIR, file);
		}

		if (fileStream.write(data)) {
			if (_.isFunction(success)) success(fileStream);
		} else {
			if (_.isFunction(error)) {
				error({
					message: L('unexpected_error', 'Unexpected error')
				});
			}
		}
	});
};

/**
 * @method exportCookiesToSystem
 * Export the HTTP cookies to the system to make them available to `WebViews`
 * @param  {String} domain The domain. Default is `HTTP.config.base`
 */
exports.exportCookiesToSystem = function(domain) {
	if (!OS_ANDROID) return;

	domain = domain || exports.config.base.replace('http://', '');
	_.each(Ti.Network.getHTTPCookiesForDomain(domain), function(c) {
		Ti.Network.addSystemCookie(c);
	});
};