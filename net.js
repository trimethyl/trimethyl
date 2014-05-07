/*

Net module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({
	base: 'http://localhost',
	timeout: 10000,
	useCache: true,
	headers: {},
	usePingServer: true
}, Alloy.CFG.net);

exports.config = function(key){
	return key ? config[key] : config;
};


// the database that store the cache
var DB = null;

// An object to hold all requests, and to give the possibility to abort it
var queue = {};
var serverConnected = null;

function calculateHash(request) {
	return Ti.Utils.md5HexDigest(request.url+JSON.stringify(request.data||{})+JSON.stringify(request.headers||{}));
}

function writeCache(request, response, info) {
	if (!DB) {
		console.error("NETCache Database not open.");
		return false;
	}

	DB.execute('INSERT OR REPLACE INTO net (id, expire, creation, content, info) VALUES (?,?,?,?,?)',
		request.hash,
		info.expire,
		require('util').timestamp(),
		response.responseData,
		JSON.stringify(info)
		);
}

function getCache(request, getIfExpired) {
	if (!DB) {
		console.error("NETCache Database not open.");
		return false;
	}

	if (!getIfExpired && request.refresh) {
		return false;
	}

	var cacheRow = DB.execute('SELECT expire, creation FROM net WHERE id = ? LIMIT 1', request.hash);
	if (!cacheRow || !cacheRow.isValidRow()) {
		return false;
	}

	var expire = +cacheRow.fieldByName('expire') || 0;
	var creation = +cacheRow.fieldByName('creation') || 0;
	var now = require('util').timestamp();

	if (!getIfExpired) {
		if (expire<now) { return false; }
		var appTimestamp = Ti.App.Properties.getString('settings.timestamp');
		if (appTimestamp && creation<appTimestamp) { return false; }
	}

	var cache = DB.execute('SELECT info, content FROM net WHERE id = ? LIMIT 1', request.hash);
	var content = cache.fieldByName('content');
	if (!content) {
		return false;
	}

	var info = require('util').parseJSON(cache.fieldByName('info')) || {};
	if (info && info.mime=='json') {
		return require('util').parseJSON(content);
	} else {
		return content;
	}
}

function setApplicationInfo(appInfo) {
	_.each(appInfo, function(v,k){
		Ti.App.Properties.setString('settings.'+k, v);
	});
}

function autoDispatch(e) {
	return require('util').alertError(e.message);
}

function getResponseInfo(response) {
	var info = {};

	var contentType = response.getResponseHeader('Content-Type');
	if (contentType=='application/json') {
		info.mime = 'json';
	}

	var expireHeader = response.getResponseHeader('Expires');
	if (expireHeader) {
		info.expire = (+new Date(expireHeader)/1000).toFixed(0);
	}

	return info;
}

function decorateRequest(request) {
	if (request.hash) {
		return request;
	}

	if (!request.url) request.url = '/';

	// if the url is not matching :// (a protocol), assign the base URL
	if (!request.url.match(/\:\/\//)) {
		request.url = config.base.replace(/\/$/,'') + '/' + request.url.replace(/^\//, '');
	}

	request.method = request.method ? request.method.toUpperCase() : 'GET';
	request.headers = _.extend(config.headers, request.headers || {});
	if (!request.timeout) { request.timeout = config.timeout; }

	if (!request.success) { request.success = function(){}; }
	if (!request.error) { request.error = autoDispatch; }

	// Rebuild the URL if is a GET and there's data
	if (request.method=='GET' && request.data) {
		var buildedQuery = require('util').buildQuery(request.data);
		delete request.data;
		request.url = request.url + buildedQuery.toString();
	}

	request.hash = calculateHash(request);
	return request;
}


function onComplete(request, response, e){
	// Delete request from queue
	delete queue[request.hash];

	// Fire the global event
	if (!request.silent) {
		Ti.App.fireEvent('net.end', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	if (request.complete) {
		request.complete();
	}

	// Get the response information
	var info = getResponseInfo(response);

	// Override response info
	if (request.mime) {
		info.mime = request.mime;
	}


	var returnValue = null;
	var returnError = null;

	// Parse based on response info
	if (info.mime=='json') {
		returnValue = require('util').parseJSON(response.responseText);
	} else {
		returnValue = response.responseData;
	}

	if (e.success) {

		/*
		SUCCESS
		*/

		if (ENV_DEVELOPMENT) {
			if (response.responseText.length<1000) {
				console.log(response);
			}
		}

		// Write cache
		if (config.useCache && !request.noCache && request.cache!==false) {
			if (request.method=='GET') {
				writeCache(request, response, info);
			}
		}

		// Success callback
		request.success(returnValue);
		return true;

	} else {

		/*
		ERROR
		*/

		if (ENV_DEVELOPMENT) {
			console.error(response);
		}

		// Parse the error returned from the server
		if (returnValue) {
			if (returnValue.error) {
				returnError = returnValue.error.message ? returnValue.error.message : returnValue.error;
			} else {
				// don't do it on API, please.
				returnError = returnValue.toString();
			}
		} else returnError = L('net_error');

		// Build the error
		var E = {
			message: returnError,
			code: response.status
		};

		// Error callback
		request.error(E);
		return false;

	}
}

exports.isOnline = function() {
	return Ti.Network.online;
};

exports.addHeader = function(a,b) {
	config.headers[a] = b;
};

exports.resetHeaders = function() {
	config.headers = {};
};

/*
PING SERVER
*/

exports.isServerConnected = function(){
	return !!serverConnected;
};

exports.usePingServer = function(){
	return !!config.usePingServer;
};

exports.connectToServer = function(cb) {
	return makeRequest({
		url: '/ping',
		method: 'POST',
		silent: true,
		info: { mime: 'json' },
		success: function(appInfo){
			serverConnected = true;
			setApplicationInfo(appInfo);

			Ti.App.fireEvent('net.ping.success');

			return cb(appInfo);
		},
		error: function(message, response){
			serverConnected = false;
			Ti.App.fireEvent('net.ping.error');
		}
	});
};

/*
END PING SERVER
*/

exports.isQueueEmpty = function(){
	return !queue.length;
};

exports.getQueue = function(){
	return queue;
};

function getQueuedRequest(hash) {
	if (_.isObject(hash)) hash = decorateRequest(hash).hash;
	return queue[hash];
}
exports.getQueuedRequest = getQueuedRequest;

function abortRequest(hash) {
	var httpClient = getQueuedRequest(hash);
	if (!httpClient) return;
	try {
		httpClient.abort();
	} catch (e) {
		console.error(e);
	}
}
exports.abortRequest = abortRequest;

exports.resetCache = exports.pruneCache = function() {
	if (!DB) {
		console.error("NETCache Database not open.");
		return false;
	}

	DB.execute('DROP TABLE IF EXISTS net');
};

exports.resetCookies = function(host) {
	// TODO
};

exports.deleteCache = function(request) {
	if (!DB) {
		console.error("NETCache Database not open.");
		return false;
	}

	request = decorateRequest(request);
	DB.execute('DELETE FROM net WHERE id = ?', request.hash);
};

function makeRequest(request) {
	request = decorateRequest(request);

	if (ENV_DEVELOPMENT) {
		console.log(request);
	}

	// Try to get the cache, otherwise make the HTTP request
	if (config.useCache && request.method=='GET') {
		var cache = getCache(request, !Ti.Network.online);
		if (cache) {

			// if we are offline, but we got cache, fire event to handle
			if (!Ti.Network.online) {
				Ti.App.fireEvent('net.offline', {
					cache: true
				});
			}

			if (request.complete) {
				request.complete();
			}

			request.success(cache);
			return request.hash;
		}
	}

	// If we aren't online and we are here, we can't proceed, so STOP!
	if (!Ti.Network.online) {

		Ti.App.fireEvent('net.offline', {
			cache: false
		});

		Ti.UI.createAlertDialog({
			title: L('net_offline_title'),
			message: L('net_offline_message'),
			ok: 'OK'
		}).show();
		return false;
	}

	var H = Ti.Network.createHTTPClient();

	if (!request.silent) {
		Ti.App.fireEvent('net.start', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	// Add this request to the queue
	queue[request.hash] = H;
	H.timeout = request.timeout;
	H.cache = false;

	// onLoad && onError are the same because we have an internal parser that discern the event.success property; WOW!
	H.onload = H.onerror = function(e){ onComplete(request, this, e); };
	H.open(request.method, request.url);

	// Set the headers
	_.each(request.headers, function(h, k) {
		H.setRequestHeader(k, h);
	});

	// Finally, send the request
	if (request.data) {
		H.send(request.data);
	} else {
		H.send();
	}

	// And return the hash of this request
	return request.hash;
}

exports.send = makeRequest;

// Aliases

exports.get = function(url, cb) {
	return makeRequest({
		url: url,
		method: 'GET',
		success: cb
	});
};

exports.post = function(url, data, cb) {
	return makeRequest({
		url: url,
		method: 'POST',
		data: data,
		success: cb
	});
};

exports.getJSON = function(url, data, success, error) {
	return makeRequest({
		url: url,
		data: data,
		method: 'GET',
		mime: 'json',
		success: success,
		error: error
	});
};

exports.postJSON = function(url, data, success, error) {
	return makeRequest({
		url: url,
		data: data,
		method: 'POST',
		mime: 'json',
		success: success,
		error: error
	});
};

(function init(){
	if (config.useCache) {
		DB = require('db').open();
		if (DB) {
			DB.execute('CREATE TABLE IF NOT EXISTS net (id TEXT PRIMARY KEY, expire INTEGER, creation INTEGER, content TEXT, info TEXT)');
		}
	}
})();
