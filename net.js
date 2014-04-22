/*

Net module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {
	base: 'http://localhost',
	timeout: 10000,
	useCache: true,
	headers: {}
};

// the database that store the cache
var DB = null;

// An object to hold all requests, and to give the possibility to abort it
var queue = {};
var serverConnected = null;

function calculateHash(request) {
	return Ti.Utils.md5HexDigest(
		request.url +
		JSON.stringify(request.data || {}) +
		JSON.stringify(request.headers || {})
		);
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

function buildQuery(a) {
	var r = [];
	_.each(a, function(v,k){ r.push(k+'='+encodeURIComponent(v)); });
	return r.join('&');
}

function setApplicationInfo(appInfo) {
	_.each(appInfo, function(v,k){
		Ti.App.Properties.setString('settings.'+k, v);
	});
}

function autoDispatch(msg) {
	return require('util').alertError(msg);
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
		var query = buildQuery(request.data);
		delete request.data;
		if (query) {
			request.url = request.url + '?' + query;
		}
	}

	request.hash = calculateHash(request);
	return request;
}


function onComplete(request, response, e){
	if (request.complete) {
		request.complete();
	}

	// Delete request from queue
	delete queue[request.hash];

	// Fire the global event
	if (!request.disableEvent) {
		Ti.App.fireEvent('net.end', {
			id: request.hash,
			eventName: request.eventName || null
		});
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

		// Write cache (async)
		if (config.useCache && !request.noCache) {
			if (request.method=='GET') {
				setTimeout(function(){
					writeCache(request, response, info);
				}, 0);
			}
		}

		// Success callback
		request.success(returnValue);
		return true;

	} else {

		/*
		ERROR
		*/

		// Parse the error returned from the server
		if (returnValue && returnValue.error) {
			returnError = returnValue.error.message ? returnValue.error.message : returnValue.error;
		} else if (returnValue) {
			returnError = returnValue.toString();
		} else {
			returnError = L('net_error');
		}

		// Error callback
		request.error(returnError, returnValue, e);
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

function isServerConnected(){
	return !!serverConnected;
}
exports.isServerConnected = isServerConnected;

exports.isQueueEmpty = function(){
	return !queue.length;
};

exports.getQueue = function(){
	return queue;
};

function getQueuedRequest(hash) {
	if (typeof(hash)!='object') {
		hash = decorateRequest(hash).hash;
	}
	var httpClient = queue[hash];
	return httpClient ? httpClient : null;
}
exports.getQueuedRequest = getQueuedRequest;

function abortRequest(hash) {
	var httpClient = getQueuedRequest(hash);
	if (!httpClient) { return; }
	httpClient.abort();
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

	// Try to get the cache, otherwise make the HTTP request
	if (config.useCache && request.method=='GET') {

		Ti.App.fireEvent('net.cache.start', { id: request.hash });
		var cache = getCache(request, !Ti.Network.online);
		Ti.App.fireEvent('net.cache.end', { id: request.hash });

		if (cache) {

			// if we are offline, but we got cache, fire event to handle
			if (!Ti.Network.online) {
				Ti.App.fireEvent('net.offline', { cache: true });
			}

			if (request.complete) { request.complete(); }
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

	// Add this request to the queue
	if (!request.disableEvent) {
		Ti.App.fireEvent('net.start', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	queue[request.hash] = H;
	H.timeout = request.timeout;

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
exports.makeRequest = makeRequest;

exports.connectToServer = function(cb) {
	makeRequest({
		url: '/ping',
		method: 'POST',
		disableEvent: true,
		info: { mime: 'json' },
		success: function(appInfo){
			serverConnected = true;
			setApplicationInfo(appInfo);
			Ti.App.fireEvent('net.ping.success');
			return cb(appInfo);
		},
		error: function(message, response){
			serverConnected = false;
			var errorWindow = Ti.UI.createWindow({
				exitOnClose: true,
				backgroundColor: '#fff',
				layout: 'vertical'
			});
			errorWindow.add(Ti.UI.createLabel({
				text: L('net_ping_error_title'),
				font:{ fontSize: 40 },
				top: 50,
				textAlign: 'center'
			}));
			errorWindow.add(Ti.UI.createLabel({
				text: L('net_ping_error_description'),
				font: { fontSize: 14 },
				top: 20, left: 20, right: 20,
				textAlign: 'center'
			}));
			errorWindow.add(Ti.UI.createImageView({
				image: '/images/offline.png',
				top: 30
			}));
			errorWindow.open();
			Ti.App.fireEvent('net.ping.error');
		}
	});
};

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

exports.init = function(c) {
	config = _.extend(config, c);

	if (config.useCache) {
		DB = require('db').open();
		if (DB) {
			DB.execute('CREATE TABLE IF NOT EXISTS net (id TEXT PRIMARY KEY, expire INTEGER, creation INTEGER, content TEXT, info TEXT)');
		}
	}
};
