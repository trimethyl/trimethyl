/**
 * @module  geo
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.gpsAccuracy="ACCURACY_HIGH"] Accuracy of localization. Must be one of `'ACCURACY_HIGH'` and `'ACCURACY_LOW'`
 * @property {Boolean} [config.geocodeUseGoogle=true] Tell to use Google Services instead of Titanium geocoding services.
 * @property {Number} [config.clusterPixelRadius=15] The clustering radius expressed in px.
 * @property {Boolean} [config.clusterRemoveOutOfBB=true] Tell the clustering to remove pins that are out of the bounding box.
 * @property {Number} [config.clusterMaxDelta=0.3] The value before the clustering is off.
 */
exports.config = _.extend({
	gpsAccuracy: 'ACCURACY_HIGH',
	geocodeUseGoogle: true,
	clusterPixelRadius: 30,
	clusterRemoveOutOfBB: true,
	clusterMaxDelta: 0.3
}, Alloy.CFG.T ? Alloy.CFG.geo : {});


var HTTP = require('T/http');
var Util = require('T/util');
var Event = require('T/event');
var Dialog = require('T/dialog');


/**
 * Attach event to current module
 */
exports.event = function(name, cb) {
	Event.on('geo.'+name, cb);
};


/**
 * @param  {Object} opt
 */
exports.authorizeLocationServices = function(opt) {
	opt = _.defaults(opt || {}, {
		inBackground: false,
		success: function(){},
		error: function(){}
	});

	var authToCheck = Ti.Geolocation[ opt.inBackground ? "AUTHORIZATION_ALWAYS" : "AUTHORIZATION_WHEN_IN_USE" ];

	// The documentation for Android is lying:
	// Ti.Geolocation.locationServicesEnabled will be false even if
	// the service is available but the app has no location permissions!
	// We have to call hasLocationPermissions() first...

	if (Ti.Geolocation.hasLocationPermissions(authToCheck) !== true) {
		if (OS_IOS) {
			// Theres a bug in Ti.Geolocation.requestLocationPermissions in iOS:
			// the callback is not always called, see https://jira.appcelerator.org/browse/TIMOB-20002

			if (Ti.Geolocation.locationServicesAuthorization === Ti.Geolocation.AUTHORIZATION_UNKNOWN) {
				Ti.Geolocation.addEventListener('authorization', function onAuthChange() {
					Ti.Geolocation.removeEventListener('authorization', onAuthChange);

					exports.authorizeLocationServices(opt);
				});
				Ti.Geolocation.requestLocationPermissions(authToCheck, function() {});
			} else {
				opt.error({
					error: L('geo_ls_restricted', 'Location services unavailable.'),
					status: Ti.Geolocation.locationServicesAuthorization
				});
			}
		} else {
			Ti.Geolocation.requestLocationPermissions(authToCheck, function(res) {
				if (res.success !== true) {
					opt.error({
						error: L('geo_ls_restricted', 'Location services unavailable.'),
						status: Ti.Geolocation.locationServicesAuthorization
					});
				} else if (Ti.Geolocation.locationServicesEnabled !== true) {
					opt.error({
						error: L('geo_ls_restricted', 'Location services unavailable.'),
						status: Ti.Geolocation.locationServicesAuthorization
					});
				} else opt.success();
			});
		}
	} else if (Ti.Geolocation.locationServicesEnabled !== true) opt.error({
		error: L('geo_ls_restricted', 'Location services unavailable.'),
		status: Ti.Geolocation.locationServicesAuthorization
	});
	else opt.success();
};

/**
 * Get the current GPS coordinates of user using `Ti.Geolocation.getCurrentPosition`
 * @param {Object}	opt
 */
exports.getCurrentPosition = function(opt) {
	opt = _.defaults(opt || {}, {
		success: function(){},
		error: function(){}
	});

	exports.authorizeLocationServices({
		success: function() {
			Ti.Geolocation.getCurrentPosition(function(e) {
				if (e.success && e.coords != null) {
					opt.success(e.coords);
				} else {
					opt.error(e);
				}
			});
		},
		error: opt.error
	});
};


/**
 * Open Apple Maps on iOS, Google Maps on Android and route from user location to defined location
 * @param  {Number} lat  		Destination latitude
 * @param  {Number} lng  		Destination longitude
 * @param  {String} [mode] 	GPS mode used (walking,driving)
 */
exports.startNavigator = function(lat, lng, mode) {
	var query = {
		directionsmode: mode || 'walking',
		daddr: lat + ',' + lng
	};

	if (OS_IOS && Ti.Platform.canOpenURL('comgooglemapsurl://')) {
		// Prompt the user which service want to use.
		// We prefer Google Maps, end.
		Dialog.option(L('open_with', 'Open with...'), [
		{
			title: 'Google Maps',
			callback: function() {
				Ti.Platform.openURL('comgooglemapsurl://' + Util.buildQuery(query));
			}
		},
		{
			title: 'Apple Maps',
			callback: function() {
				Ti.Platform.openURL('http://maps.apple.com/' + Util.buildQuery(query));
			}
		},
		{
			title: L('cancel', 'Cancel'),
			cancel: true
		}
		]);
	} else {
		Ti.Platform.openURL((OS_IOS ? 'http://maps.apple.com/' : 'https://maps.google.com/maps/') + Util.buildQuery(query));
	}
};


/**
 * Return the coordinates of an address
 * @param {Object} opt
 * @param {String} opt.address 		The address to geocode
 * @param {Function} opt.success 	Success callback
 * @param {Function} [opt.error] 	Error callback
 */
exports.geocode = function(opt) {
	if (exports.config.geocodeUseGoogle === true) {

		HTTP.send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			cache: false,
			data: {
				address: opt.address,
				sensor: 'false'
			},
			format: 'json',
			success: function(res) {
				if (res.status !== 'OK' || _.isEmpty(res.results)) {
					if (_.isFunction(opt.error)) opt.error();
					return;
				}

				opt.success({
					success: true,
					latitude: res.results[0].geometry.location.lat,
					longitude: res.results[0].geometry.location.lng
				});
			},
			error: opt.error
		});

	} else {

		Ti.Geolocation.forwardGeocoder(opt.address, function(res) {
			if (!res.success) {
				if (_.isFunction(opt.error)) opt.error();
				return;
			}

			opt.success({
				success: true,
				latitude: res.latitude,
				longitude: res.longitude
			});
		});
	}
};


/**
 * Return the address with the specified coordinates
 * @param {Object} opt
 */
exports.reverseGeocode = function(opt) {
	if (exports.config.geocodeUseGoogle) {

		HTTP.send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			data: {
				latlng: opt.lat + ',' + opt.lng,
				sensor: 'false'
			},
			format: 'json',
			success: function(res) {
				if (res.status !== 'OK' || res.results.length === 0) {
					if (_.isFunction(opt.error)) opt.error();
					return;
				}

				opt.success({
					success: true,
					address: res.results[0].formatted_address,
					results: res.results
				});
			},
			error: opt.error
		});

	} else {

		Ti.Geolocation.reverseGeocoder(opt.lat, opt.lng, function(res) {
			if (!res.success || _.isEmpty(res.places)) {
				if (_.isFunction(opt.error)) opt.error();
				return;
			}

			opt.success({
				success: true,
				address: res.places[0].address,
				results: res.places
			});
		});
	}
};

/**
 * Return a list of predicted places based on an input string.
 * To use this method, you need to create a browser key for the Google Places API Web Service and place it in the tiapp.xml file as a property named "google.places.api.key".
 * @see {@link https://developers.google.com/places/web-service/autocomplete}
 * @param {Object} opt
 * @param {String} opt.input 		The text string on which to search.
 * @param {String} [opt.offset] 	The position, in the input term, of the last character that the service uses to match predictions.
 * @param {String} [opt.location] 	The point around which you wish to retrieve place information. Must be specified as latitude,longitude.
 * @param {Number} [opt.radius] 	The distance (in meters) within which to return place results.
 * @param {String} [opt.language] 	The language code, indicating in which language the results should be returned, if possible. See https://developers.google.com/maps/faq#languagesupport
 * @param {String} [opt.types] 		The types of place results to return. See https://developers.google.com/places/web-service/autocomplete#place_types
 * @param {String} [opt.components] A grouping of places to which you would like to restrict your results. Currently, you can use components to filter by country. The country must be passed as a two character, ISO 3166-1 Alpha-2 compatible country code. For example: components=country:fr would restrict your results to places within France.
 * @param {Function} [opt.success] 	Success callback
 * @param {Function} [opt.error] 	Error callback
 */
exports.autocomplete = function(opt) {
	var key = Ti.App.Properties.getString('google.places.api.key');
	if (!key) {
		throw new Error('This method needs a Google Maps API key to work');
	}

	if (!opt.input) {
		Ti.API.error('Geo: Missing required parameter "input"');
		if (_.isFunction(opt.error)) opt.error();
		return;
	}

	var data = _.pick(opt, 'input', 'offset', 'location', 'radius', 'language', 'types', 'components');
	_.extend(data, { key: key });

	HTTP.send({
		url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
		data: data,
		format: 'json',
		success: function(res) {
			if (!res.predictions) {
				if (_.isFunction(opt.error)) opt.error();
				return;
			}

			opt.success(res.predictions);
		},
		error: opt.error
	});
};

/**
 * Return the details of a place with a specific placeid.
 * To use this method, you need to create a browser key for the Google Places API Web Service and place it in the tiapp.xml file as a property named "google.places.api.key".
 * @see {@link https://developers.google.com/places/web-service/details}
 * @param {Object} opt
 * @param {String} opt.placeid 		A textual identifier that uniquely identifies a place, returned from a Place Search. See https://developers.google.com/places/web-service/search
 * @param {Object} [opt.extensions] Indicates if the Place Details response should include additional fields.
 * @param {String} [opt.language] 	The language code, indicating in which language the results should be returned, if possible. See https://developers.google.com/maps/faq#languagesupport
 * @param {Function} [opt.success] 	Success callback
 * @param {Function} [opt.error] 	Error callback
 */
exports.getPlaceDetails = function(opt) {
	var key = Ti.App.Properties.getString('google.places.api.key');
	if (!key) {
		throw new Error('This method needs a Google Maps API key to work');
	}

	if (!opt.placeid) {
		Ti.API.error('Geo: Missing required parameter "placeid"');
		if (_.isFunction(opt.error)) opt.error();
		return;
	}

	var data = _.pick(opt, 'placeid', 'extensions', 'language');
	_.extend(data, { key: key });

	HTTP.send({
		url: 'https://maps.googleapis.com/maps/api/place/details/json',
		data: data,
		format: 'json',
		success: function(res) {
			if (res.status !== 'OK' || _.isEmpty(res.result)) {
				if (_.isFunction(opt.error)) opt.error();
				return;
			}

			opt.success(res.result);
		},
		error: opt.error
	});
};

function deg2rad(deg) {
	return deg * 0.017453; // return deg * (Math.PI/180); OPTIMIZE! :*
}

function dist(a,b) {
	return Math.sqrt(Math.pow(a,2) + Math.pow(b,2)).toFixed(2);
}

/**
 * Return the distance express in km between two points of the earth
 *
 * @param  {Number} lat1 The latitude of first point
 * @param  {Number} lon1 The longitude of first point
 * @param  {Number} lat2 The latitude of second point
 * @param  {Number} lon2 The longitude of second point
 * @return {Number} The distance expressed in km
 */
exports.distanceInKm = function(lat1, lon1, lat2, lon2) {
	var dLat = deg2rad(lat2 - lat1) / 2;
	var dLon = deg2rad(lon2 - lon1) / 2;
	var a = Math.sin(dLat) * Math.sin(dLat) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon) * Math.sin(dLon);
	return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


/**
 * Process a set of markers and cluster them
 * @param  {Object} event     The event raised from `regionchanged`.
 * @param  {Object} markers 	The markers **must be** an instance of `Backbone.Collection` or an Object id-indexed
 * @param  {Object} [keys] 	The keys of the object to get informations. Default: `{ latitude: 'lat', longitude: 'lng', id: 'id' }`
 * @return {Array}
 */
exports.markerCluster = function(event, markers, keys) {
	keys = _.defaults(keys || {}, {
		latitude: 'lat',
		longitude: 'lng',
		id: 'id'
	});

	var pins = {};
	var group = {};
	var isBackbone = (markers instanceof Backbone.Collection);

	// latR, lngR represents the current degrees visible
	var latR = (event.source.size.height || Alloy.Globals.SCREEN_HEIGHT) / event.latitudeDelta;
	var lngR = (event.source.size.width || Alloy.Globals.SCREEN_WIDTH) / event.longitudeDelta;
	var degreeLat = 2 * exports.config.clusterPixelRadius / latR;
	var degreeLng = 2 * exports.config.clusterPixelRadius / lngR;
	var boundingBox = [
		event.latitude - event.latitudeDelta/2 - degreeLat,
		event.longitude + event.longitudeDelta/2 + degreeLng,
		event.latitude + event.latitudeDelta/2 + degreeLat,
		event.longitude - event.longitudeDelta/2 - degreeLng
	];

	function removeOutOfBBFunction(m) {
		var tmp_lat = parseFloat( isBackbone === true ? m.get(keys.latitude) : m[keys.latitude] );
		var tmp_lng = parseFloat( isBackbone === true ? m.get(keys.longitude) : m[keys.longitude] );
		if (tmp_lat < boundingBox[2] && tmp_lat > boundingBox[0] && tmp_lng > boundingBox[3] && tmp_lng < boundingBox[1]) {
			pins[ m[keys.id] ] = {
				latitude: tmp_lat,
				longitude: tmp_lng
			};
		}
	}

	function createCObjFunction(m) {
		var tmp_lat = parseFloat( isBackbone === true ? m.get(keys.latitude) : m[keys.latitude] );
		var tmp_lng = parseFloat( isBackbone === true ? m.get(keys.longitude) : m[keys.longitude] );
		pins[ m[keys.id] ] = {
			latitude: tmp_lat,
			longitude: tmp_lng
		};
	}

	// Start clustering
	if (isBackbone === true) {
		markers.each(exports.config.clusterRemoveOutOfBB === true ? removeOutOfBBFunction : createCObjFunction);
	} else {
		_.each(markers, exports.config.clusterRemoveOutOfBB === true ? removeOutOfBBFunction : createCObjFunction);
	}

	// Cycle over all markers, and group in {g} all nearest markers by {id}
	var zoomToCluster = (event.longitudeDelta > exports.config.clusterMaxDelta);
	_.each(pins, function(a, id) {
		_.each(pins, function(b, jd) {
			if (id == jd || zoomToCluster === false) return;
			if (a == null) return;
			if (b == null) return;

			var d = dist(
				lngR * Math.abs(+a.latitude - b.latitude),
				lngR * Math.abs(+a.longitude - b.longitude)
			);
			if (d < exports.config.clusterPixelRadius) {
				group[id] = group[id] || [id];
				group[id].push(jd);
				delete pins[id];
				delete pins[jd];
			}
		});
	});

	// cycle all over pin and calculate the average of group pin
	_.each(group, function(g, id){
		var gpin = {
			latitude: 0.0,
			longitude: 0.0,
			count: _.keys(g).length
		};

		_.each(g, function(gid) {
			gpin.latitude += parseFloat(isBackbone === true ? markers.get(gid).get(keys.latitude) : markers[gid][keys.latitude]);
			gpin.longitude += parseFloat(isBackbone === true ? markers.get(gid).get(keys.longitude) : markers[gid][keys.longitude]);
		});

		gpin.latitude = gpin.latitude / gpin.count;
		gpin.longitude = gpin.longitude / gpin.count;
		pins["g"+id] = gpin;
	});

	group = null; // GC

	// Set all annotations
	return _.map(pins, function(pin, id){
		if (pin.count > 1) {
			return {
				latitude: parseFloat(pin.latitude.toFixed(2)),
				longitude: parseFloat(pin.longitude.toFixed(2)),
				count: pin.count
			};
		} else {
			// Ensure ID is a number
			return id << 0;
		}
	});
};


/**
 * Check if the Google Play Services are installed and updated,
 * otherwise Maps doesn't work and the app crashes.
 *
 * It the check fail, an error is displayed that redirect to the Play Store,
 * and the app is terminated.
 *
 * On iOS, simply return `true`
 *
 * @return {Boolean}
 */
exports.checkForDependencies = function() {
	if (OS_IOS) return false;

	var TiMap = require('ti.map');
	var rc = TiMap.isGooglePlayServicesAvailable();

	if (rc === TiMap.SUCCESS) {
		return true;
	}

	var errorMessage = null;
	switch (rc) {
		case TiMap.SERVICE_MISSING:
		errorMessage = L('googleplayservices_missing', 'Google Play services is missing. Please install Google Play services from the Google Play store in order to use the application.');
		break;
		case TiMap.SERVICE_VERSION_UPDATE_REQUIRED:
		errorMessage = L('googleplayservices_outofdate', 'Google Play services is out of date. Please update Google Play services in order to use the application.');
		break;
		case TiMap.SERVICE_DISABLED:
		errorMessage = L('googleplayservices_disabled', 'Google Play services is disabled. Please enable Google Play services in order to use the application.');
		break;
		case TiMap.SERVICE_INVALID:
		errorMessage = L('googleplayservices_invalid', 'Google Play services cannot be authenticated. Reinstall Google Play services in order to use the application.');
		break;
		default:
		errorMessage = L('googleplayservices_error', 'Google Play services generated an unknown error. Reinstall Google Play services in order to use the application.');
		break;
	}

	// Open Play Store to download
	Util.errorAlert(errorMessage, function(){
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=com.google.android.gms');
		Ti.Android.currentActivity.finish();
	});
};


/**
 * Get the minimum MapRegion to include all annotations in array
 * @param  {Object} 	array 	An array of annotations
 * @param  {Number}	mulGap	Gap multiplier
 * @return {Map.MapRegionType}
 */
exports.getRegionBounds = function(array, mulGap) {
	mulGap = mulGap || 1.4;
	var lats = _.pluck(array, 'latitude');
	var lngs = _.pluck(array, 'longitude');
	var bb = [ _.min(lats), _.min(lngs), _.max(lats), _.max(lngs) ];
	return {
		latitude: (bb[0] + bb[2]) / 2,
		longitude: (bb[1] + bb[3]) / 2,
		latitudeDelta: mulGap * (bb[2] - bb[0]),
		longitudeDelta: mulGap * (bb[3] - bb[1])
	};
};

/**
 * Check if the location services are enabled and the app is authorized to use them.
 * @return {Boolean}
 */
exports.isAuthorized = function() {
	return !!Ti.Geolocation.locationServicesEnabled &&
	!!(Ti.Geolocation.hasLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS) || Ti.Geolocation.hasLocationPermissions(Ti.Geolocation.AUTHORIZATION_WHEN_IN_USE));
};

/**
 * Check if the the app is denied from using the location services.
 * Returns false for every other platform.
 * @return {Boolean}
 */
exports.isDenied = function() {
	return !exports.isAuthorized();
};



//////////
// Init //
//////////

Ti.Geolocation.accuracy = Ti.Geolocation[exports.config.gpsAccuracy];
