/**
 * @class  HTTP.Request
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * HTTP Request class
 */

var HTTP = require('T/http');
var Util = require('T/util');
var Event = require('T/event');

function extractHTTPText(data, info) {
	if (info != null) {
		if (info.format === 'json') return Util.parseJSON(data);
	}
	return data;
}

function extractHTTPError(data, info) {
	if (info != null && data != null) {
		if (info.format === 'json') {
			if (_.isObject(data.error) && _.isString(data.error.message)) return data.error.message;
			if (_.isString(data.error)) return data.error;
		}
	}
	return L('http_error');
}

function HTTPRequest(opt) {
	if (opt.url == null) {
		throw new Error('HTTP.Request: URL not set');
	}

	this.opt = _.clone(opt);

	// if the url is not matching a protocol, assign the base URL
	if (/\:\/\//.test(opt.url)) {
		this.url = opt.url;
	} else {
		this.url = HTTP.config.base.replace(/\/$/, '') + '/' + opt.url.replace(/^\//, '');
	}

	this.method = this.method ? this.method.toUpperCase() : 'GET';
	this.headers = _.extend({}, HTTP.config.headers, opt.headers);
	this.timeout = opt.timeout !== undefined ? opt.timeout : HTTP.config.timeout;

	this.onSuccess = _.isFunction(opt.success) ? opt.success : function(){};
	this.onComplete = _.isFunction(opt.complete) ? opt.complete : function(){};

	if (opt.error !== undefined) {
		this.onError = _.isFunction(opt.error) ? opt.error : function(){};
	} else {
		this.onError = HTTP.errorHandler;
	}

	// Rebuild the URL if is a GET and there's data
	if (opt.data != null) {
		if (this.method === 'GET' && _.isObject(opt.data)) {
			this.url = this.url + Util.buildQuery(opt.data);
		} else {
			this.data = opt.data;
		}
	}

	this.hash = this._calculateHash();
}

HTTPRequest.prototype.toString = function() {
	return this.hash;
};

HTTPRequest.prototype._maybeCacheResponse = function() {
	if (HTTP.config.useCache === false) return;
	if (this.opt.cache === false)
	if (this.method !== 'GET') return;

	if (this.responseInfo.ttl <= 0) return;
	if (this.client.responseText == null) return;

	Ti.API.debug('HTTP: ['+this.hash+'] CACHED', {
		expireOn: Util.timestampForHumans(Util.fromnow(this.responseInfo.ttl))
	});

	HTTP.Cache.set(this.hash, this.client.responseText, this.responseInfo.ttl, this.responseInfo);
};

HTTPRequest.prototype._getResponseInfo = function() {
	if (this.client == null || this.client.readyState <= 1) {
		return { broken: true };
	}

	var httpExpires = this.client.getResponseHeader('Expires');
	var httpContentType = this.client.getResponseHeader('Content-Type');
	var httpTTL = this.client.getResponseHeader('X-Cache-Ttl');

	var info = {
		format: 'blob',
		ttl: HTTP.config.defaultCacheTTL
	};

	if (this.client.responseText != null) info.format = 'text';
	if (/application\/json/.test(httpContentType)) info.format = 'json';

	if (httpExpires != null) info.ttl = Util.timestamp(httpExpires) - Util.now();
	if (httpTTL != null) info.ttl = httpTTL;

	if (this.opt.format != null) info.format = this.opt.format;
	if (this.opt.ttl != null) info.ttl = this.opt.ttl;

	return info;
};

HTTPRequest.prototype._onComplete = function(e) {
	this.endTime = new Date();

	this.onComplete();
	HTTP.removeFromQueue(this);

	Ti.API.debug('HTTP: ['+this.hash+'] COMPLETE', {
		networkTime: (this.endTime.getTime()-this.startTime.getTime())+'ms',
		status: this.client.status
	});

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
	if (this.responseInfo.broken === true) {
		Ti.API.error('HTTP: ['+this.hash+'] IS BROKEN');
		return this.onError({ message: L('http_error') });
	}

	var data = this.client.responseData;
	var text = extractHTTPText(this.client.responseText, this.responseInfo);

	if (e.success === true && data != null) {

		// Write the cache (if needed and supported by configuration)
		this._maybeCacheResponse();

		Ti.API.debug('HTTP: ['+this.hash+'] SUCCESS');
		this.onSuccess(text, data);

	} else {

		var errObject = { message: extractHTTPError(text, this.responseInfo), code: this.client.status };
		Ti.API.error('HTTP: ['+this.hash+'] ERROR', errObject);
		this.onError(errObject);

	}
};

HTTPRequest.prototype._calculateHash = function() {
	var hash = this.url + Util.hashJavascriptObject(this.data) + Util.hashJavascriptObject(this.headers);
	return 'net_' + Ti.Utils.md5HexDigest(hash).substr(0, 10);
};

/**
 * @method getCachedResponse
 * Return (if exists) the cache
 * @return {Object}
 */
HTTPRequest.prototype.getCachedResponse = function() {
	if (HTTP.config.useCache === false) return;
	if (this.opt.cache === false || this.opt.refresh === true) return;
	if (this.method !== 'GET') return;

	var cachedData = HTTP.Cache.get(this.hash);
	if (cachedData == null) return;

	Ti.API.debug('HTTP: ['+this.hash+'] CACHE SUCCESS', {
		expireOn: Util.timestampForHumans(cachedData.expire),
		remainTime: (cachedData.expire-Util.now())+'s'
	});

	return extractHTTPText(cachedData.value, cachedData.info);
};

/**
 * @method send
 * Sent the request over the network
 */
HTTPRequest.prototype.send = function() {
	this.client = Ti.Network.createHTTPClient({
		timeout: this.timeout,
		cache: false,
	});

	var self = this;
	this.client.onload = this.client.onerror = function(e) {
		self._onComplete(e);
	};

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
	this.startTime = new Date();
	if (this.data != null) {
		this.client.send(this.data);
	} else {
		this.client.send();
	}

	Ti.API.debug('HTTP: ['+this.hash+'] SENT');
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

		this.onComplete();
		this.onSuccess(cache);

	} else {

		if (HTTP.isOnline()) {
			this.send();
		} else {

			Ti.API.error('HTTP: connection is offline');
			if (HTTP.config.autoOfflineMessage === true) {
				require('T/dialog').alert(L('http_offline_title'), L('http_offline_message'));
			}

			this.onComplete();
			this.onError({ message: L('http_offline_message') });

			Event.trigger('http.offline');
		}
	}
};

module.exports = HTTPRequest;
