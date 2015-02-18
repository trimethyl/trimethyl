/**
 * @class  	HTTP.Request
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var HTTP = require('T/http');
var Util = require('T/util');
var Event = require('T/event');
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
		this.url = HTTP.config.base.replace(/\/$/, '') + '/' + opt.url.replace(/^\//, '');
	}

	this.method = opt.method != null ? opt.method.toUpperCase() : 'GET';
	this.headers = _.extend({}, HTTP.getHeaders(), opt.headers);
	this.timeout = opt.timeout != null ? opt.timeout : HTTP.config.timeout;

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

	// Fill the defer, we will manage the callbacks through it
	this.defer = Q.defer();
	this.defer.promise.then(function() { self._onSuccess.apply(self, arguments); });
	this.defer.promise.fail(function() { self._onError.apply(self, arguments); });
}

HTTPRequest.prototype._log = function(message) {
	if (HTTP.config.log) {
		Ti.API.debug('HTTP: ['+this.hash+']', message);
	}
};

HTTPRequest.prototype.toString = function() {
	return this.hash;
};

HTTPRequest.prototype._maybeCacheResponse = function(data) {
	if (HTTP.config.useCache == false || this.opt.cache == false) return;
	if (this.method !== 'GET') return;

	if (this.responseInfo.ttl <= 0) {
		this._log('uncachable due TTL <= 0');
		return;
	}

	Cache.set(this.hash, data, this.responseInfo.ttl, this.responseInfo);
	this._log('cached for ' + this.responseInfo.ttl + 's');
};


/**
 * @method getCachedResponse
 * Return (if exists) the cache
 * @return {Object}
 */
HTTPRequest.prototype.getCachedResponse = function() {
	if (HTTP.config.useCache === false) return null;
	if (this.opt.cache === false || this.opt.refresh === true) return null;
	if (this.method !== 'GET') return null;

	var cachedData = Cache.get(this.hash);
	if (cachedData == null) return null;

	this._log('cache hit (' + (cachedData.expire-Util.now()) + 's)');

	var value = cachedData.value;
	if (cachedData.info.format === 'blob') {
		return value;
	} else {
		return extractHTTPText(value, cachedData.info);
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
	Ti.API.error('HTTP: ['+this.hash+']', err);

	if (_.isFunction(this.opt.complete)) this.opt.complete(e);

	if (HTTP.config.errorAlert && this.opt.errorAlert != false) {
		Util.errorAlert(err, function() {
			if (_.isFunction(self.opt.error)) self.opt.error(err);
		});
		return;
	}

	if (_.isFunction(self.opt.error)) self.opt.error(err);
};

HTTPRequest.prototype._onSuccess = function() {
	this._log(arguments[0]);

	if (_.isFunction(this.opt.complete)) this.opt.complete.apply(this, arguments);
	if (_.isFunction(this.opt.success)) this.opt.success.apply(this, arguments);
};

HTTPRequest.prototype._onComplete = function(e) {
	this.endTime = Date.now();
	HTTP.removeFromQueue(this);

	// Fire the global event
	if (!this.opt.silent) {
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
		this._log('response success (' + (this.endTime-this.startTime) + 'ms)');
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


/**
 * @method send
 * Sent the request over the network
 */
HTTPRequest.prototype.send = function() {
	var self = this;
	this._log(this.method + ' ' + this.url + ' ' + (JSON.stringify(this.data) || ''));

	this.client = Ti.Network.createHTTPClient({
		timeout: this.timeout,
		cache: false,
	});

	this.client.onload = this.client.onerror = function(e) { self._onComplete(e); };

	// Add this request to the queue
	HTTP.addToQueue(this);

	if (!this.opt.silent) {
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

/**
 * @method resolve
 *
 * Magically resolve the request.
 * It checks cache, connectivity, and resolve.
 */
HTTPRequest.prototype.resolve = function() {
	var cache = this.getCachedResponse();
	if (cache != null) {
		this.defer.resolve(cache);
		return;
	}

	if (Ti.Network.online) {
		this.send();
	} else {

		Ti.API.warn('HTTP: connection is offline');
		Event.trigger('http.offline');

		this.defer.reject({
			offline: true,
			message: L('network_offline', 'Check your connectivity.')
		});

	}
};

/**
 * @method abort
 * Abort this request
 */
HTTPRequest.prototype.abort = function() {
	if (this.client != null) {
		this.client.abort();
	}
};


/**
 * @method success
 * Promises, man!
 */
HTTPRequest.prototype.success = function(func) {
	this.defer.promise.then(func);
	return this;
};

/**
 * @method error
 * Promises, man!
 */
HTTPRequest.prototype.error = function(func) {
	this.defer.promise.fail(func);
	return this;
};

/**
 * @method error
 * Promises, man!
 */
HTTPRequest.prototype.complete = function(func) {
	this.defer.promise.fin(func);
	return this;
};

/**
 * @method getPromise
 * Get the deferred internal object
 */
HTTPRequest.prototype.getPromise = function() {
	return this.defer.promise;
};


module.exports = HTTPRequest;
