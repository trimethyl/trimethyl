/**
 * @class  HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * HTTP network module
 */

/**
 * * **base**: The base URL of the API
 * * **timeout**: Global timeout for the requests. After this value (express in milliseconds) the requests throw an error. Default: `http://localhost`
 * * **useCache**: Check if the requests are automatically cached. Default: `true`
 * * **cacheDriver**: Cache driver to use. Default `database`
 * * **headers**: Global headers for all requests. Default: `{}`
 * * **usePingServer**: Enable the PING-Server support. Default: `true`
 * * **autoOfflineMessage**: Enable the automatic alert if the connection is offline
 * * **defaultCacheTTL**: Force a predef TTL if not found on the headers. Default: `0`
 * @type {Object}
 */
var config = _.extend({
	base: 'http://localhost',
	timeout: 10000,
	useCache: true,
	cacheDriver: 'database',
	headers: {},
	autoOfflineMessage: true,
	defaultCacheTTL: 0,
}, Alloy.CFG.T.http);
exports.config = config;


function originalErrorHandler(e) {
	var message = (e != null && e.message != null) ? e.message : L('Unexpected error');
	require('T/dialog').alert(L('Error'), message);
}

/**
 * @property errorHandler
 * Global error handler
 * @type {Function}
 */
exports.errorHandler = originalErrorHandler;

/**
 * Get the error handler
 * @param {Function} fun The new function
 */
function getErrorHandler() {
	return exports.errorHandler;
}
exports.getErrorHandler = getErrorHandler;

/**
 * Set a new global handler for the errors
 * @param {Function} fun The new function
 */
function setErrorHandler(fun) {
	exports.errorHandler = fun;
}
exports.setErrorHandler = setErrorHandler;

/**
 * Reset the original error handler
 */
function resetErrorHandler(){
	exports.errorHandler = originalErrorHandler;
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
 * @property headers
 * Global headers
 * @type {Array}
 */
exports.headers = config.headers;

/**
 * Add a global header for all requests
 * @param {String} key 		The header key
 * @param {String} value 	The header value
 */
function addHeader(key, value) {
	exports.headers[key] = value;
}
exports.addHeader = addHeader;

/**
 * Remove a global header
 * @param {String} key 		The header key
 */
function removeHeader(key) {
	delete exports.headers[key];
}
exports.removeHeader = removeHeader;

/**
 * Reset all globals headers
 */
function resetHeaders() {
	exports.headers = {};
}
exports.resetHeaders = resetHeaders;


/**
 * @property queue
 * Queue for HTTP Requests
 * @type {Function}
 */
exports.queue = [];

/**
 * Check if the requests queue is empty
 * @return {Boolean}
 */
function isQueueEmpty(){
	return _.isEmpty(exports.queue);
}
exports.isQueueEmpty = isQueueEmpty;

/**
 * Get the current requests queue
 * @return {Array}
 */
function getQueue(){
	return exports.queue;
}
exports.getQueue = getQueue;

/**
 * Add a request to queue
 * @param {HTTP.Request} request
 */
function addToQueue(request) {
	exports.queue[request.hash] = request;
}
exports.addToQueue = addToQueue;

/**
 * Remove a request from queue
 */
function removeFromQueue(request) {
	delete exports.queue[request.hash];
}
exports.removeFromQueue = removeFromQueue;


/**
 * @property Cache
 * Cache driver
 * @type {Object}
 */
exports.Cache = require('T/cache').use(config.cacheDriver);

/**
 * Set a different cache strategy
 * @param {String} driver
 */
function setCacheDriver(driver) {
	exports.Cache = require('T/cache').use(driver);
}
exports.setCacheDriver = setCacheDriver;


/**
 * Reset the cookies for all requests
 */
function resetCookies() {
	Ti.Network.createHTTPClient().clearCookies(config.base);
}
exports.resetCookies = resetCookies;


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
	var Request = require('T/http/request');
	var request = new Request(opt);
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
 * Make a GET request to that url with that data and setting the format forced to JSON
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
		format: 'json',
		success: success,
		error: error
	});
};

/**
 * @method  postJSON
 * Make a POST request to that url with that data and setting the format forced to JSON
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
		format: 'json',
		success: success,
		error: error
	});
};
