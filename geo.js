/*

Geo module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {
	accuracy: "ACCURACY_HIGH",
	directionUrl: "http://appcaffeina.com/static/maps/directions",
	useGoogleForGeocode: true
};

function checkForServices() {
	if (!Ti.Geolocation.locationServicesEnabled) {
		require('util').alertError(L('geo_error'));
		return false;
	}
	return true;
}

exports.getRoute =  function getRoute(args, rargs, cb) {
	require('net').send({
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


exports.localize = function localize(cb) {
	if (!checkForServices()) {
		return cb({ error: true });
	}

	Ti.App.fireEvent('geo.start');
	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

	Ti.Geolocation.getCurrentPosition(function(e){
		Ti.App.fireEvent('geo.end');
		if (e.error) {
			require('util').alertError(L('geo_error'));
			return cb(e);
		}

		cb(e);
	});
};

var gyroCallbacks = [];

exports.gyroscope = function gyroscope(cb) {
	if (!checkForServices()) {
		return cb({ error: true });
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
		var url = D+"?directionsmode="+(mode||'walking')+"&daddr="+lat+","+lng+"&saddr="+mylat+","+mylng;
		Ti.Platform.openURL(url);
	});
};

exports.geocode = function(address, cb) {
	if (config.useGoogleForGeocode) {
		require('net').send({
			url: 'https://maps.googleapis.com/maps/api/geocode/json',
			data: {
				address: address,
				sensor: 'false'
			},
			mime: 'json',
			success: function(res){
				if (res.status!='OK' || !res.results.length) {
					require('util').alertError(L('geo_unabletogeocode'));
					return;
				}
				if (cb) cb(res.results[0].geometry.location.lat, res.results[0].geometry.location.lng);
			},
			error: function(err){
				console.error(err);
				require('util').alertError(L('geo_unabletogeocode'));
			}
		});
	} else {
		Ti.Geolocation.forwardGeocoder(address, function(res){
			if (!res.success) {
				require('util').alertError(L('geo_unabletogeocode'));
				return;
			}
			if (cb) cb(res.latitude, res.longitude);
		});
	}
};

exports.reverseGeocode = function(lat, lng, cb) {
	if (!lat || !lng) {
		require('util').alertError(L('geo_unabletoreversegeocode'));
		return;
	}

	if (config.useGoogleForGeocode) {
		require('net').send({
			url: 'https://maps.googleapis.com/maps/api/geocode/json',
			data: {
				latlng: lat+','+lng,
				sensor: 'false'
			},
			mime: 'json',
			success: function(res){
				if (res.status!='OK' || !res.results.length) {
					require('util').alertError(L('geo_unabletoreversegeocode'));
					return;
				}
				if (cb) cb(res.results[0].formatted_address, res.results);
			},
			error: function(err){
				console.error(err);
				require('util').alertError(L('geo_unabletoreversegeocode'));
			}
		});
	} else {
		Ti.Geolocation.reverseGeocoder(lat, lng, function(res){
			if (!res.success || !res.places || !res.places.length) {
				require('util').alertError(L('geo_unabletoreversegeocode'));
				return;
			}
			if (cb) cb(res.places[0].address, res.places);
		});
	}
};

exports.init = function(c) {
	config = _.extend(config, c);
};

