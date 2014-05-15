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
	return Ti.Geolocation.locationServicesEnabled;
}

exports.enableServicesAlert = function(){
	if (OS_IOS) {
		require('util').alert(L('geo_error_title'), L('geo_error_msg'));
	} else {
		alert(L('geo_error_title'));
	}
};

function getRoute(args, rargs, cb) {
	require('net').send({
		url: config.directionUrl,
		data: args,
		success: function(resp){
			var points = [];
			for (var k in resp) {
				points.push({ latitude: resp[k][0], longitude: resp[k][1] });
			}
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

function localize(cb) {
	if (!checkForServices()) {
		return cb({ error: true, servicesDisabled: true });
	}

	Ti.App.fireEvent('geo.start');
	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

	Ti.Geolocation.getCurrentPosition(function(e){
		Ti.App.fireEvent('geo.end');
		if (!e.success || !e.coords) {
			return cb({ error: true });
		}

		cb(e);
	});
}
exports.localize = localize;

var __gyroCb = [];

function gyroscope(cb) {
	if (!checkForServices()) {
		return cb({ error: true });
	}

	__gyroCb.push(cb);

	Ti.App.fireEvent('gyro.start');
	Ti.Geolocation.purpose = L('geo_purpose');

	Ti.Geolocation.addEventListener('heading', cb);
}
exports.gyroscope = gyroscope;

exports.gyroscopeOff = function(cb) {
	if (cb) {
		Ti.Geolocation.removeEventListener('heading', cb);
	} else {
		_.each(__gyroCb, function(fun){
			Ti.Geolocation.removeEventListener('heading', fun);
		});
	}
};

exports.startNavigator = function(lat, lng, mode) {
	localize(function(e) {
		if (!e.success) {
			require('util').alertError(L('geo_unabletonavigate'));
			return;
		}

		var D = OS_IOS ? "http://maps.apple.com/" : "https://maps.google.com/maps/";
		Ti.Platform.openURL(D + require('util').buildQuery({
			directionsmode: mode || 'walking',
			saddr: e.coords.latitude + "," + e.coords.longitude,
			daddr: lat + "," + lng
		}));
	});
};

exports.geocode = function(address, cb) {
	if (config.useGoogleForGeocode) {

		require('net').send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			noCache: true,
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
				Ti.API.error("Geo: "+err);
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
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			noCache: true,
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
				Ti.API.error("Geo: "+err);
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
