var config = {
	base: 'http://localhost',
	cacheDir: Ti.Filesystem.applicationCacheDirectory,
	timeout: 10000,
	useCache: true,
	headers: {},
	cacheNamespace: 'netcache'
};

// An object to hold all requests, and to give the possibility to abort it
var queue = {};

// Contain a JSON received on startup
var applicationInfo = {
	timestamp: 0
};

function calculateHash(request) {
	return Ti.Utils.md5HexDigest(request.url+JSON.stringify(request.data||{})+JSON.stringify(request.headers||{}));
}

function getCacheStream(request) {
	request = decorateRequest(request);
	var filename = config.cacheNamespace+request.hash;
	return Ti.Filesystem.getFile(config.cacheDir, filename);
}

function getCacheInfo(request) {
	request = decorateRequest(request);
	if (!Ti.App.Properties.hasProperty(config.cacheNamespace+request.hash)) {
		Ti.App.Properties.removeProperty(config.cacheNamespace+request.hash);
		console.warn("No cache found for "+request.hash);
		return false;
	}
	return Ti.App.Properties.getObject(config.cacheNamespace+request.hash);
}

function setCacheInfo(request, info) {
	Ti.App.Properties.setObject(config.cacheNamespace+request.hash, info);
}

function writeCache(request, response, info) {
	var cacheStream = getCacheStream(request);
	if (!cacheStream.write(response.responseData)) {
		console.error("Cache writing failed: "+ex);
		return false;
	}
	setCacheInfo(request, info);
	return true;
}

function getCache(request, noExpireCheck) {
	var cacheInfo = getCacheInfo(request);
	if (!cacheInfo) return false;

	if (Alloy.CFG.debug) {
		console.log("------- CACHE BEHAVIORS ("+request.url+")-----------");
		console.log("Info: ", cacheInfo);
		console.log("Refresh: ", request.refresh?1:0);
		console.log("Expired: ", +new Date()-(cacheInfo.expire||0));
		console.log("Apptime: ", ((applicationInfo.timestamp||0)*1000)-(cacheInfo.creation||-1));
	}

	if (!noExpireCheck) {
		if (request.refresh) return false;
		if ((cacheInfo.expire||0)<+new Date()) return false;
		if (applicationInfo && (cacheInfo.creation||-1)<(applicationInfo.timestamp||0)*1000) {
			console.warn("Cache is expired for application timestamp");
			return false;
		}
	}

	var stream = getCacheStream(request);
	if (!stream.exists()) return false;

	var data = stream.read();
	if (cacheInfo.mime=='json') returnValue = parseJSON(data);
	else returnValue = data;
	return returnValue;
}

function buildQuery(a) {
	var r = [];
	for (var k in a) {
		r.push(k+'='+encodeURIComponent(a[k]));
	}
	return r.join('&');
}

function autoDispatch(msg) {
	return require('util').alertError(msg);
}

function getResponseInfo(response) {
	var info = {};

	// mime type
	var contentType = response.getResponseHeader('Content-Type');
	if (contentType=='application/json') info.mime = 'json';

	// creation time
	info.creation = +new Date();

	// expires
	try {
		var expire = new Date(response.getResponseHeader('Expires'));
		if (expire) info.expire = +expire;
	} catch (e) {
		info.expire = 0;
	}

	return info;
}

function decorateRequest(request) {
	if (request.hash) return request;

	if (!request.url) throw 'Please specify almost the URL!';
	if (request.url.substr(0,1)=='/') {
		request.url = config.base + request.url;
	}

	request.method = request.method ? request.method.toUpperCase() : 'GET';
	// request.data = request.data || null;
	request.headers = _.extend(config.headers, request.headers||{});
	request.timeout = request.timeout || config.timeout;

	// request.complete = request.complete || null;
	request.success = request.success || function(){};
	request.error = request.error || autoDispatch;

	if (request.data && request.method=='GET') {
		var query = buildQuery(request.data);
		if (query) request.url += '?' + query;
		delete request.data;
	}

	request.hash = calculateHash(request);
	return request;
}

function parseJSON(text) {
	try {
		var json = JSON.parse(text);
		if (!json) return null;
		return json;
	} catch (ex) { return null; }
}

function onComplete(request, response, e){
	if (request.complete) request.complete();
	delete queue[request.hash];

	if (!request.disableEvent) {
		Ti.App.fireEvent('network.end', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}

	var info = getResponseInfo(response);
	if (request.mime) info.mime = request.mime;

	var returnValue = null;
	if (info.mime=='json') returnValue = parseJSON(response.responseText);
	else returnValue = response.responseData;

	if (Alloy.CFG.debug) {
		console.log("------- NETWORK INFO ("+request.url+")-----------");
		console.log(info);
	}

	if (!e.success) {
		var returnError = L('network.error', 'Unrecognized network error');

		// We parse the message only if is not a critical (>=500) HTTP error
		if (e.code<500) {
			if (returnValue) {
				if (info.mime=='json' && returnValue.error) {
					if (returnValue.error.message) returnError = returnValue.error.message;
					else returnError = returnValue.error;
				} else {
					returnError = returnValue.toString();
				}
			}
		}

		if (Alloy.CFG.debug) {
			console.error("------- NETWORK ERROR ("+request.url+") -----------");
			console.error(e);
			console.error(returnValue);
		}

		return request.error(returnError, returnValue);
	}

	// Write cache async
	if (config.useCache && request.method=='GET') {
		setTimeout(function(){
			writeCache(request, response, info);
		}, 0);
	}

	// HTTP code < 400
	if (Alloy.CFG.debug) {
		console.log("------- NETWORK RESPONSE ("+request.url+")-----------");
		console.log(returnValue);
	}
	request.success(returnValue);
}

exports.isOnline = function() {
	return Ti.Network.online;
};

exports.getApplicationInfo = function(){
	return applicationInfo;
};

exports.addHeader = function(a,b) {
	config.headers[a] = b;
};

exports.responseetHeaders = function() {
	config.headers = {};
};

exports.isServerConnected = isServerConnected = function(){
	return !!(applicationInfo);
};

exports.isQueueEmpty = function(){
	return _.isEmpty(queue);
};

exports.getQueue = function(){
	return queue;
};

exports.getQueuedRequest = getQueuedRequest = function(hash) {
	if (typeof(hash)!='object') hash = decorateRequest(hash).hash;
	var httpClient = queue[hash];
	return httpClient ? httpClient : null;
};

exports.abortRequest = abortRequest = function(hash) {
	var httpClient = getQueuedRequest(hash);
	if (!httpClient) return;
	httpClient.abort();
};

exports.resetCache = exports.pruneCache = resetCache = function() {
	try {
		var dir = Ti.Filesystem.getFile(config.cacheDir);
		dir.deleteDirectory(true);
		dir.createDirectory();
	} catch (e) {}
};

exports.resetCookies = function(host) {
};

exports.deleteCache = deleteCache = function(request) {
	request = decorateRequest(request);
	Ti.App.Property.removeProperty(config.cacheNamespace+request.hash);
	var stream = getCacheStream(request);
	if (!stream.exists()) return true;
	return stream.deleteFile();
};

exports.send = send = function(request) {
	request = decorateRequest(request);
	if (Alloy.CFG.debug) {
		console.log("------- NETWORK REQUEST ("+request.url+")-----------");
		console.log(request);
	}

	// Try to get the cache, otherwise make the HTTP request
	if (config.useCache && request.method=='GET') {
		var cache = getCache(request, !Ti.Network.online);
		if (cache) {
			if (Alloy.CFG.debug) {
				console.log("------- NETWORK CACHE ("+request.url+")-----------");
				console.log(cache);
			}

			// if we are offline, but we got cache, fire event to handle
			if (!Ti.Network.online) {
				Ti.App.fireEvent('network.offline', { cache: true });
			}

			if (request.complete) request.complete();
			request.success(cache);
			return request.hash;
		}
	}

	// If we aren't online and we are here, we can't proceed, so STOP!
	if (!Ti.Network.online) {
		Ti.App.fireEvent('network.offline', { cache: false });
		Ti.UI.createAlertDialog({
			title: L('network.offline.title', 'No connectivity'),
			message: L('network.offline.message', 'You need an active Internet connection in order to make this request. Please connect to Internet.'),
			ok: L('network.offline.ok', 'Okay!')
		}).show();
		return false;
	}

	var H = Ti.Network.createHTTPClient();

	// Add this request to the queue
	if (!request.disableEvent) {
		Ti.App.fireEvent('network.start', {
			id: request.hash,
			eventName: request.eventName || null
		});
	}
	queue[request.hash] = H;
	H.timeout = request.timeout;

	// onLoad && onError are the same because we have an internal parser that discern the event.success property
	H.onload = H.onerror = function(e){ onComplete(request, this, e); };
	H.open(request.method, request.url);

	for (var k in request.headers) {
		H.setRequestHeader(k, request.headers[k]);
	}

	if (request.data) H.send(request.data);
	else H.send();

	return request.hash;
};

exports.connectToServer = function(cb) {
	send({
		url: '/ping',
		method: 'POST',
		disableEvent: true,
		success: function(r){
			applicationInfo = r;
			Ti.App.fireEvent('network.ping.success');
			return cb(applicationInfo);
		},
		error: function(message, response){
			var errorWindow = Ti.UI.createWindow({
				exitOnClose: true,
				backgroundColor: '#fff',
				layout: 'vertical'
			});
			errorWindow.add(Ti.UI.createLabel({
				text: L('network.ping.error.title', 'Server error'),
				font:{ fontSize: 40 },
				top: 50,
				textAlign: 'center'
			}));
			errorWindow.add(Ti.UI.createLabel({
				text: L('network.ping.error.description', "Oops, it seems that our server is down.\nPlease check in a while"),
				font: { fontSize: 14 },
				top: 20, left: 20, right: 20,
				textAlign: 'center'
			}));
			errorWindow.add(Ti.UI.createImageView({
				image: '/images/offline.png',
				top: 30
			}));
			errorWindow.open();
			Ti.App.fireEvent('network.ping.error');
		}
	});
};

// Aliases

exports.get = function(url, cb) {
	return send({
		url: url,
		method: 'GET',
		success: cb
	});
};

exports.post = function(url, data, cb) {
	return send({
		url: url,
		method: 'POST',
		data: data,
		success: cb
	});
};

exports.getJSON = function(url, cb) {
	return send({
		url: url,
		method: 'GET',
		mime: 'json',
		success: cb
	});
};

exports.init = init = function(c) {
	config = _.extend(config, c);
};
