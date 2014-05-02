/*

Geo module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({
	accuracy: "ACCURACY_HIGH",
	directionUrl: "http://appcaffeina.com/static/maps/directions",
	useGoogleForGeocode: true
}, Alloy.CFG.geo);

function checkForServices() {
	if (!Ti.Geolocation.locationServicesEnabled) {
		require('util').alertError(L('geo_error'));
		return false;
	}
	return true;
}

function getRoute(args, rargs, cb) {
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
}
exports.getRoute = getRoute;

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


function localize(cb) {
	if (!checkForServices()) {
		return cb({ error: true });
	}

	Ti.App.fireEvent('geo.start');
	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

	Ti.Geolocation.getCurrentPosition(function(e){
		Ti.App.fireEvent('geo.end');
		cb(e);
	});
}
exports.localize = localize;

var gyroCallbacks = [];

function gyroscope(cb) {
	if (!checkForServices()) {
		return cb({ error: true });
	}

	gyroCallbacks.push(cb);

	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.addEventListener('heading', function(e){
		if (cb) cb(e);
	});
}
exports.gyroscope = gyroscope;

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
	localize(function(e) {
		if (e.success && e.coords) {

			var D = OS_IOS ? "http://maps.apple.com/" : "https://maps.google.com/maps/";
			Ti.Platform.openURL(D + require('util').buildQuery({
				directionsmode: mode || 'walking',
				daddr: e.coords.latitude + "," + e.coords.longitude,
				saddr: lat + "," + lng
			}));

		} else  {
			require('util').alertError(L('geo_unabletonavigate'));
		}
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
					return cb({ error: true });
				}

				cb({
					success: true,
					latitude: res.results[0].geometry.location.lat,
					longitude: res.results[0].geometry.location.lng
				});
			},
			error: function(err){
				console.error(err);
				cb({ error: true });
			}
		});
	} else {

		Ti.Geolocation.forwardGeocoder(address, function(res){
			if (!res.success) {
				return cb({ error: true });
			}

			cb({
				success: true,
				latitude: res.latitude,
				longitude: res.longitude
			});
		});
	}
};

exports.reverseGeocode = function(lat, lng, cb) {
	if (!lat || !lng) {
		return cb({ error: true });
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
					return cb({ error: true });
				}

				cb({
					success: true,
					address: res.results[0].formatted_address,
					results: res.results
				});
			},
			error: function(err){
				console.error(err);
				cb({ error: true });
			}
		});

	} else {

		Ti.Geolocation.reverseGeocoder(lat, lng, function(res){
			if (!res.success || !res.places || !res.places.length) {
				return cb({ error: true });
			}

			cb({
				success: true,
				address: res.places[0].address,
				results: res.places
			});
		});
	}
};