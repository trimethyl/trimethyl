var HTTP = require('T/http');
var Util = require('T/util');
var Event = require('T/event');

function extractHTTPData(data, info) {
	if (info != null && data != null) {
		if (info.format === 'json') return Util.parseJSON(data.toString());
		if (info.format === 'text') return data.toString();
	}
	return data;
}

function extractHTTPErrorMessage(data, info) {
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

	this.getHash();
}

HTTPRequest.prototype.__toString = function() {
	return this.getHash();
};

HTTPRequest.prototype.cacheResponse = function() {
	if (HTTP.config.useCache === false) return;
	if (this.opt.cache === false)
	if (this.method !== 'GET') return;

	var info = this.getResponseInfo();
	if (info.ttl <= 0) return;

	Ti.API.debug('HTTP: ['+this.hash+'] CACHED',
	'- Expire on '+Util.timestampForHumans(Util.fromnow(info.ttl)));

	HTTP.Cache.set(this.hash, this.client.responseData, info.ttl, info);
};

HTTPRequest.prototype.getResponseInfo = function() {
	if (this.responseInfo != null) {
		return this.responseInfo;
	}

	var httpExpires = this.client.getResponseHeader('Expires');
	var httpContentType = this.client.getResponseHeader('Content-Type');
	var httpTTL = this.client.getResponseHeader('X-Cache-Ttl');

	this.responseInfo = { format: 'blob', ttl: HTTP.config.defaultCacheTTL };

	if (this.client.responseText != null) {
		this.responseInfo.format = 'text';
		if (httpContentType != null) {
			if (httpContentType.match(/application\/json/)) {
				this.responseInfo.format = 'json';
			}
		}
	}

	if (httpExpires != null) this.responseInfo.ttl = Util.timestamp(httpExpires) - Util.now();
	if (httpTTL != null) this.responseInfo.ttl = httpTTL;

	if (this.opt.format != null) this.responseInfo.format = this.opt.format;
	if (this.opt.ttl != null) this.responseInfo.ttl = this.opt.ttl;

	return this.responseInfo;
};

HTTPRequest.prototype.__onComplete = function(e) {
	this.endTime = new Date();

	this.onComplete();
	HTTP.removeFromQueue(this);

	Ti.API.debug('HTTP: ['+this.hash+'] COMPLETE',
	'- Time is '+(this.endTime.getTime()-this.startTime.getTime())+'ms',
	'- Status is '+this.client.status);

	// Fire the global event
	if (this.opt.silent !== true) {
		Event.trigger('http.end', {
			hash: this.hash,
			eventName: this.opt.eventName
		});
	}

	// If the readyState is not DONE, trigger error, because
	// client.onload is the function to be called upon a SUCCESSFULL response.
	if (this.client.readyState <= 1) {
		Ti.API.error('HTTP: ['+this.hash+'] IS BROKEN');
		return this.onError();
	}

	// Get the response information and override
	var info = this.getResponseInfo();
	Ti.API.debug('HTTP: ['+this.hash+'] PARSED',
	'- Format is '+info.format,
	'- TTL is '+info.ttl);

	var httpData = extractHTTPData(this.client.responseData, info);

	if (e.success === false || httpData == null) {
		var errObject = {
			message: extractHTTPErrorMessage(httpData, info),
			code: this.client.status
		};

		Ti.API.error('HTTP: ['+this.hash+'] ERROR', errObject);
		return this.onError(errObject);
	}

	// Write the cache (if needed and supported by configuration)
	this.cacheResponse();

	Ti.API.debug('HTTP: ['+this.hash+'] SUCCESS');
	this.onSuccess(httpData);
};

HTTPRequest.prototype.getHash = function() {
	if (this.hash != null) {
		return this.hash;
	}

	var hash = this.url + Util.hashJavascriptObject(this.data) + Util.hashJavascriptObject(this.headers);
	this.hash = 'net_' + Ti.Utils.md5HexDigest(hash).substr(0, 10);
	return this.hash;
};


HTTPRequest.prototype.getCachedResponse = function() {
	if (HTTP.config.useCache === false) return;
	if (this.opt.cache === false || this.opt.refresh === true) return;
	if (this.method !== 'GET') return;

	var cachedData = HTTP.Cache.get(this.hash);
	if (cachedData == null) return;

	Ti.API.debug('HTTP: ['+this.hash+'] CACHE SUCCESS',
	'- Expire on '+Util.timestampForHumans(cachedData.expire),
	'- Remain time is '+(cachedData.expire-Util.now())+'s');

	return extractHTTPData(cachedData.value, cachedData.info);
};

HTTPRequest.prototype.send = function() {
	this.client = Ti.Network.createHTTPClient({
		timeout: this.timeout,
		cache: false,
	});

	var self = this;
	this.client.onload = this.client.onerror = function(e) {
		self.__onComplete(e);
	};

	// Add this request to the queue
	HTTP.addToQueue(this);

	if (this.opt.silent !== true) {
		Event.trigger('http.start', {
			hash: this.hash,
			eventName: this.opt.eventName
		});
	}

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

	Ti.API.debug('HTTP: ['+this.hash+'] SENT', this);
};

HTTPRequest.prototype.resolve = function() {
	var cache = this.getCachedResponse();
	if (cache != null) {
		this.onComplete();
		return this.onSuccess(cache);
	}

	if (HTTP.isOnline()) {
		return this.send();
	}

	Ti.API.error('HTTP: connection is offline');
	if (HTTP.config.autoOfflineMessage === true) {
		require('T/dialog').alert(L('http_offline_title'), L('http_offline_message'));
	}

	this.onComplete();
	this.onError({
		message: L('http_offline_message')
	});

	Event.trigger('http.offline');
};


/*
Init
*/

module.exports = HTTPRequest;