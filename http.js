/**
 * @class  HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * HTTP network module
 */

/**
 * * **base**: The base URL of the API
 * * **timeout**: Global timeout for the requests. After this value (express in milliseconds) the requests throw an error. Default: `http://localhost`
 * * **useCache**: Check if the requests are automatically cached. Default: `true`
 * * **headers**: Global headers for all requests. Default: `{}`
 * * **usePingServer**: Enable the PING-Server support. Default: `true`
 * * **autoOfflineMessage**: Enable the automatic alert if the connection is offline
 * * **defaultCacheTTL**: Force a predef TTL if not found on the headers. Default: `0`
 * * **cacheDriver**: Set a different cache driver. Default: `null`
 * @type {Object}
 */
var config = _.extend({
	base: 'http://localhost',
	timeout: 10000,
	useCache: true,
	cacheDriver: 'database',
	headers: {},
	usePingServer: true,
	autoOfflineMessage: true,
	defaultCacheTTL: 0,
}, Alloy.CFG.T.http);
exports.config = config;

var Cache = null;
var Event = require('T/event');
var Util = require('T/util');

var queue = {}; // queue object for all requests
var serverConnected = null; // in case of ping server
var errorHandler = null; // global error ha handler

function setCacheDriver(driver) {
	Cache = require('T/cache').use(driver);
}

function hash(obj) {
	if (obj == null) return '';
	if (_.isArray(obj)) return obj;
	if (_.isObject(obj)) {
		var keys = _.keys(obj).sort();
		return _.object(keys, _.map(keys, function (key) { return obj[key]; }));
	}
	return obj.toString();
}

function calculateHash(request) {
	var hash = request.url + hash(request.data) + hash(request.headers);
	return 'net_' + Ti.Utils.md5HexDigest(hash).substr(0, 6);
}

function getResponseInfo(response, request) {
	var info = {
		mime: 'blob',
		ttl: config.defaultCacheTTL,
	};

	var httpExpires = response.getResponseHeader('Expires');
	var httpContentType = response.getResponseHeader('Content-Type');
	var httpTTL = response.getResponseHeader('X-Cache-Ttl');

	if (response.responseText != null) {
		info.mime = 'text';
		if (httpContentType != null) {
			if (httpContentType.match(/application\/json/)) info.mime = 'json';
		}
	}
	if (httpExpires != null) info.ttl = Util.timestamp(httpExpires) - Util.now();
	if (httpTTL != null) info.ttl = httpTTL;

	return _.extend(info, _.pluck('mime','ttl', request));
}

function getHTTPErrorMessage(data) {
	if (_.isObject(data.error) && _.isString(data.error.message)) return data.error.message;
	if (_.isString(data.error)) return data.error;
	return L('http_error');
}

function decorateRequest(request) {
	if (request.hash != null) return request;
	if (request.url == null) request.url = '/';

	// if the url is not matching `://` (a protocol), assign the base URL
	if (/\:\/\//.test(request.url) === false) {
		request.url = config.base.replace(/\/$/,'') + '/' + request.url.replace(/^\//, '');
	}

	request.method = request.method ? request.method.toUpperCase() : 'GET';
	request.headers = _.extend({}, config.headers, request.headers);
	request.timeout = request.timeout || config.timeout;
	if (request.error === undefined) request.error = errorHandler;

	// Rebuild the URL if is a GET and there's data
	if (request.method === 'GET' && _.isObject(request.data)) {
		var buildedQuery = Util.buildQuery(request.data);
		delete request.data;
		request.url = request.url + buildedQuery;
	}

	request.hash = calculateHash(request);
	return request;
}

function onComplete(request, response, e){
	request.endTime = +new Date();
	Ti.API.debug('HTTP: REQ-['+request.hash+'] complete ', {
		time: (request.endTime-request.startTime),
		httpCode: response.status,
		success: e.success,
		error: e.error
	});

	// Delete request from queue
	delete queue[request.hash];

	if (_.isFunction(request.complete)) request.complete();

	// Fire the global event
	if (request.silent !== true) {
		Event.trigger('http.end', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	// If the readyState is not DONE, trigger error, because
	// HTTPClient.onload is the function to be called upon a SUCCESSFULL response.
	if (response.readyState <= 1) {
		Ti.API.error('HTTP: REQ-['+request.hash+'] is broken (readyState<=1)');
		if (_.isFunction(request.error)) request.error();

		return false;
	}

	// Get the response information and override
	var info = getResponseInfo(response, request);
	var httpData = parseHTTPData(response.responseData, info);

	Ti.API.debug('HTTP: REQ-['+request.hash+'] infos ', info);

	if (e.success === true && httpData != null) {

		cacheResponse(request, response.responseData, info);

		Ti.API.debug('HTTP: REQ-['+request.hash+'] success');
		if (_.isFunction(request.success)) request.success(httpData);

	} else {

		var errObject = {
			message: getHTTPErrorMessage(httpData),
			code: response.status
		};

		Ti.API.error('HTTP: REQ-['+request.hash+'] error', errObject);
		if (_.isFunction(request.error)) request.error(errObject);
	}
}

function getCachedResponse(request) {
	if (config.useCache === false) return;
	if (request.cache === false || request.refresh === true || request.method !== 'GET') return;
	return Cache.get(request.hash);
}

function cacheResponse(request, data, info) {
	if (config.useCache === false) return;
	if (request.cache === false || request.method !== 'GET') return;
	if (info.ttl <= 0) return;

	var untilString = (new Date(1000 * Util.fromnow(info.ttl))).toString();
	Ti.API.debug('HTTP: REQ-['+request.hash+'] hash been cached until ' + untilString);

	Cache.set(request.hash, data, info.ttl, info);
}

function parseHTTPData(data, info) {
	if (info.mime === 'json') return Util.parseJSON(data.toString());
	if (info.mime === 'text') return data.toString();
	return data;
}

/**
 * The main function of the module, create the HTTPClient and make the request
 *
 *	There are various options to pass:
 *
 * * **url**: The endpoint URL
 * * **method**: The HTTP method to use (GET|POST|PUT|PATCH|..)
 * * **headers**: An Object key-value of additional headers
 * * **timeout**: Timeout after stopping the request and triggering an error
 * * **cache**: Set to false to disable the cache
 * * **success**: The success callback
 * * **error**: The error callback
 * * **mime**: Override the mime for that request (like `json`)
 * * **ttl**: Override the TTL seconds for the cache
 *
 * @param  {Object} request The request dictionary
 * @return {String}	The hash to identify this request
 */
function send(request) {
	request = decorateRequest(request);

	// Get cached response, othwerise send the HTTP request
	var cachedData = getCachedResponse(request);
	if (cachedData != null) {
		var httpParsedData = parseHTTPData(cachedData.value, cachedData.info);
		Ti.API.debug('HTTP: REQ-['+request.hash+'] has been found on cache');

		if (_.isFunction(request.complete)) request.complete();
		if (_.isFunction(request.success)) request.success(httpParsedData);

		return request.hash;
	}

	// If we aren't online and we are here, we can't proceed, so STOP!
	if (isOnline() === false) {
		Ti.API.error('HTTP: connection is offline');

		if (config.autoOfflineMessage === true) {
			Util.alert(L('http_offline_title'), L('http_offline_message'));
		}

		if (_.isFunction(request.complete)) request.complete();
		if (_.isFunction(request.error)) request.error({ message: L('http_offline_message') });

		Event.trigger('http.offline');
		return request.hash;
	}


	// Start real request

	var H = Ti.Network.createHTTPClient();
	request.startTime = +new Date();

	H.timeout = request.timeout;
	H.cache = false; // disable integrated iOS cache

	// onLoad && onError are the same because we have an internal parser
	// that discern the event.success property
	H.onload = H.onerror = function(e){
		onComplete(request, this, e);
	};

	// Add this request to the queue
	queue[request.hash] = H;

	if (request.silent !== true) {
		Event.trigger('http.start', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	H.open(request.method, request.url);
	_.each(request.headers, function(h, k) {
		H.setRequestHeader(k, h);
	});

	// Finally, send the request
	if (_.isObject(request.data)) {
		H.send(request.data);
	} else {
		H.send();
	}

	Ti.API.debug('HTTP: REQ-['+request.hash+'] sent', request);
	return request.hash;
}
exports.send = send;


function originalErrorHandler(e) {
	Util.alertError( e != null && e.message != null ? e.message : L('Error') );
}

function setApplicationInfo(appInfo) {
	_.each(appInfo, function(v,k){
		Ti.App.Properties.setString('settings.'+k, v);
	});
}

/**
 * Set a new global handler for the errors
 * @param {Function} fun The new function
 */
function setErrorHandler(fun) {
	errorHandler = fun;
}
exports.setErrorHandler = setErrorHandler;


/**
 * Reset the original error handler
 */
function resetErrorHandler(){
	errorHandler = originalErrorHandler;
}
exports.resetErrorHandler = resetErrorHandler;


/**
 * Check the internet connectivity
 * @return {Boolean} The status
 */
function isOnline() {
	return Ti.Network.online;
}
exports.isOnline = isOnline;


/**
 * Add a global header for all requests
 * @param {String} key 		The header key
 * @param {String} value 	The header value
 */
function addHeader(key, value) {
	config.headers[key] = value;
}
exports.addHeader = addHeader;


/**
 * Remove a global header
 * @param {String} key 		The header key
 */
function removeHeader(key) {
	delete config.headers[key];
}
exports.removeHeader = removeHeader;


/**
 * Reset all globals headers
 */
function resetHeaders() {
	config.headers = {};
}
exports.resetHeaders = resetHeaders;


/**
 * When using a PING-Server, check if the connection has been estabilished
 * @return {Boolean}
 */
function isServerConnected(){
	return serverConnected;
}
exports.isServerConnected = isServerConnected;


/**
 * Return the value of config.usePingServer
 * @return {Boolean}
 */
function usePingServer(){
	return config.usePingServer;
}
exports.usePingServer = usePingServer;


/**
 * Connect to the PING-Server
 *
 * This method also set the properties for **settings.{X}**
 *
 * Trigger a *http.ping.success* on success
 *
 * Trigger a *http.ping.error* on error
 *
 * @param  {Function} callback The success callback
 */
function connectToServer(callback) {
	return send({
		url: '/ping',
		method: 'POST',
		silent: true,
		success: function(appInfo){
			serverConnected = true;
			setApplicationInfo(appInfo);

			Event.trigger('http.ping.success');
			if (_.isFunction(callback)) callback(true);
		},
		error: function(){
			serverConnected = false;

			Event.trigger('http.ping.error');
			if (_.isFunction(callback)) callback(false);
		}
	});
}
exports.connectToServer = connectToServer;


/**
 * Check if the requests queue is empty
 * @return {Boolean}
 */
function isQueueEmpty(){
	return _.isEmpty(queue);
}
exports.isQueueEmpty = isQueueEmpty;


/**
 * Get the current requests queue
 * @return {Array}
 */
function getQueue(){
	return queue;
}
exports.getQueue = getQueue;


/**
 * Get the request identified by the hash in the queued requests
 *
 * If a complete request object is passed, the hash is calculated
 *
 * @param  {String|Object} hash The hash or the request
 * @return {Ti.Network.HTTPClient}
 */
function getQueuedRequest(hash) {
	if (_.isObject(hash)) hash = decorateRequest(hash).hash;
	return queue[hash];
}
exports.getQueuedRequest = getQueuedRequest;


/**
 * Abort the request identified by the hash in the queued requests
 *
 *  If a complete request object is passed, the hash is calculated
 *
 * @param  {String|Object} hash The hash or the request
 */
function abortRequest(hash) {
	var httpClient = getQueuedRequest(hash);
	if (httpClient == null) return;

	httpClient.abort();
	Ti.API.debug('HTTP: REQ-['+hash+'] request aborted');
}
exports.abortRequest = abortRequest;


/**
 * Prune all HTTP cache
 */
exports.pruneCache = function(){
	if (Cache === null) return;
	Cache.prune();
};

/**
 * Delete the cache entry for the passed request
 *
 * If a complete request object is passed, the hash is calculated
 *
 * @param  {String|Object} request [description]
 */
exports.removeCache = function(hash) {
	if (Cache === null) return;
	if (_.isObject(hash)) hash = decorateRequest(hash).hash;
	Cache.remove(hash);
};


/**
 * Reset the cookies for all requests
 */
function resetCookies() {
	Ti.Network.createHTTPClient().clearCookies(config.base);
}
exports.resetCookies = resetCookies;



/**
 * @method get
 * Make a GET request to that URL
 * @param  {String}   	url The endpoint url
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error Error callback
 * @return {String}		The hash
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
 * @param  {String}   	url The endpoint url
 * @param  {Object}   	data The data
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error Error callback
 * @return {String}		The hash
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
 * Make a GET request to that url with that data and setting the mime forced to JSON
 * @param  {String}   	url 	The endpoint url
 * @param  {Object}   	data 	The data
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error Error callback
 * @return {String}		The hash
 */
exports.getJSON = function(url, data, success, error) {
	return send({
		url: url,
		data: data,
		method: 'GET',
		mime: 'json',
		success: success,
		error: error
	});
};

/**
 * @method  postJSON
 * Make a POST request to that url with that data and setting the mime forced to JSON
 * @param  {String}   	url 	The endpoint url
 * @param  {Object}   	data 	The data
 * @param  {Function} 	success  Success callback
 * @param  {Function} 	error Error callback
 * @return {String}		The hash
 */
exports.postJSON = function(url, data, success, error) {
	return send({
		url: url,
		data: data,
		method: 'POST',
		mime: 'json',
		success: success,
		error: error
	});
};


/*
Init
*/

errorHandler = originalErrorHandler;
setCacheDriver(config.cacheDriver);
