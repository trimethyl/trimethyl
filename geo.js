var config = {
	accuracy: "ACCURACY_HIGH",
	directionUrl: "http://appcaffeina.com/static/maps/directions",
};

function checkForServices() {
	if (!Ti.Geolocation.locationServicesEnabled) {
		require('util').alertError(L('geo_error'));
		return false;
	}
	return true;
}

exports.getRoute = getRoute = function(args, rargs, cb) {
	require('network').send({
		url: config.directionUrl,
		data: args,
		success: function(resp){
			var points = [];
			for (var k in resp) points.push({ latitude: resp[k][0], longitude: resp[k][1] });
				return cb(require('ti.map').createRoute(_.extend({
					name: 'Route',
					color: '#000',
					points: points,
					width: 6
				}, rargs)));
		}
	});
};

exports.getRouteFromUserLocation = function(destination, args, rargs, cb) {
	localize(function(e){
		var userLocation = { latitude: e.coords.latitude, longitude: e.coords.longitude };
		getRoute(_.extend({
			origin: userLocation.latitude+','+userLocation.longitude,
			destination: destination
		}, args||{}), rargs||{}, cb);
	});
};

var locaCallbacks = [];

exports.localize = localize = function(cb) {
	if (!checkForServices()) {
		return;
	}

	Ti.App.fireEvent('geo.start');
	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

	Ti.Geolocation.getCurrentPosition(function(e){
		Ti.App.fireEvent('geo.end');
		if (e.error) return require('util').alertError( e.error || L('geo_error') );
		if (cb) cb(e, e.coords.latitude, e.coords.longitude);
	});
};

var gyroCallbacks = [];

exports.gyroscope = gyroscope = function(cb) {
	if (!checkForServices()) {
		return;
	}

	gyroCallbacks.push(cb);

	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.addEventListener('heading', function(e){
		if (cb) cb(e);
	});
};

exports.gyroscopeOff = function(cb) {
	if (cb) {
		Ti.Geolocation.removeEventListener('heading', cb);
	} else {
		_.each(gyroCallbacks, function(fun){
			Ti.Geolocation.removeEventListener('heading', fun);
		});
	}
};

exports.startNavigator = function(lat, lng, mode) {
	localize(function(e, mylat, mylng) {
		var D = OS_IOS ? "http://maps.apple.com/" : "https://maps.google.com/maps";
		Ti.Platform.openURL(D+"?directionsmode="+(mode||'walking')+"&daddr="+lat+","+lng+"&saddr="+mylat+","+mylng);
	});
};

exports.geocode = function(address, cb) {
	require('network').getJSON('https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&sensor=false', function(res){
		if (res.status!='OK') return false;
		if (cb) cb(res.results);
	});
};

exports.reverseGeocode = function(lat, lng, cb) {
	require('network').getJSON('https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&sensor=false', function(res){
		if (res.status!='OK') return false;
		if (cb) cb(res.results);
	});
};

exports.init = function(c) {
	config = _.extend(config, c);
};

