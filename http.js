/**
 * @class  HTTP
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


/**
 * @property config
 * @property {String} config.base The base URL of the API
 * @property {Number} [config.timeout=10000] Global timeout for the reques. after this value (express in milliseconds) the requests throw an error.
 * @property {Object} [config.headers={}] Global headers for all requests.
 */
exports.config = _.extend({
	base: '',
	timeout: 10000,
	headers: {},
}, Alloy.CFG.T ? Alloy.CFG.T.http : {});


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
	var request = new (require('T/http/request'))(opt);
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
		ondatastream: ondatastream,
		success: function(text, data) {
			var fileStream = null;
			if (file.nativePath) {
				fileStream = file;
			} else {
				var appDataDir = Util.getAppDataDirectory();
				var appDataDirStream = Ti.Filesystem.getFile(appDataDir);
				if ( ! appDataDirStream.exists()) appDataDirStream.createDirectory();
				fileStream = Ti.Filesystem.getFile(appDataDir, file);
			}

			if (fileStream.write(data)) {
				if (_.isFunction(success)) success(fileStream);
			} else {
				if (_.isFunction(error)) error({ message: L('unexpected_error', 'Unexpected error') });
			}
		},
		error: error
	});
};
