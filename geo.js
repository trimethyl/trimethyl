/**
 * @class  	Geo
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * * `gpsAccuracy`: Accuracy of Geo. Must be one of `'ACCURACY_HIGH'`, `'ACCURACY_LOW'`
 * * `geocodeUseGoogle`: Tell to use Google Services instead of Titanium geocoding services.
 * * `clusterPixelRadius`: The clustering radius expressed in PX. Default: `15`
 * * `clusterRemoveOutofBB`: Tell the clustering to remove pins that are out of the bounding box. Default: `true`
 * * `clusterMaxDelta`: The value before the clustering is off. Default: `0.3`
 * @type {Object}
 */
var config = _.extend({
	gpsAccuracy: 'ACCURACY_HIGH',
	geocodeUseGoogle: true,
	clusterPixelRadius: 15,
	clusterRemoveOutofBB: true,
	clusterMaxDelta: 0.3
}, Alloy.CFG.geo);
exports.config = config;

var Event = require('T/event');

function checkForServices() {
	return !! Ti.Geolocation.locationServicesEnabled;
}

/**
 * @method getCurrentPosition
 * Get the current GPS coordinates of user using `Ti.Geolocation.getCurrentPosition`
 *
 * A `geo.start` event is triggered at start, and a `geo.end` event is triggered on end
 *
 * @param {Object}	opt
 */
exports.getCurrentPosition = function(opt) {
	if ( ! checkForServices()) {
		if (_.isFunction(opt.complete)) opt.complete();
		if (_.isFunction(opt.error)) opt.error({ servicesDisabled: true });
		return;
	}

	if (opt.silent !== false) Event.trigger('geo.start');
	Ti.Geolocation.getCurrentPosition(function(e) {
		if (_.isFunction(opt.complete)) opt.complete();
		if (opt.silent !== false) Event.trigger('geo.end');
		if (e.success === false) {
			if (_.isFunction(opt.error)) opt.error();
		} else {
			if (_.isFunction(opt.success)) opt.success(e.coords);
		}
	});
};


/**
 * @method startNavigator
 * Open Apple Maps on iOS, Google Maps on Android and route from user location to defined location
 * @param  {Number} lat  		Desination latitude
 * @param  {Number} lng  		Destination longitude
 * @param  {String} [mode] 	GPS mode used (walking,driving)
 */
exports.startNavigator = function(lat, lng, mode) {
	exports.getCurrentPosition({
		success: function(g) {

			Ti.Platform.openURL(
				(OS_IOS ? 'http://maps.apple.com/' : 'https://maps.google.com/maps/') +
				require('T/util').buildQuery({
					directionsmode: mode || 'walking',
					saddr: g.latitude + ',' + g.longitude,
					daddr: lat + ',' + lng
				})
			);

		}
	});
};


/**
 * @method geocode
 * Return the coordinates of an address
 * @param {Object} opt
 */
exports.geocode = function(opt) {
	if (config.geocodeUseGoogle === true) {

		require('T/http').send({
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
			if (res.success === false) {
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
 * @method reverseGeocode
 * Return the address with the specified coordinates
 * @param {Object} opt
 */
exports.reverseGeocode = function(opt) {
	if (config.useGoogleForGeocode) {

		require('T/http').send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			noCache: true,
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
			if (res.success === false || _.isEmpty(res.places)) {
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


function deg2rad(deg) {
	return deg * 0.017453; // return deg * (Math.PI/180); OPTIMIZE! :*
}

function dist(a,b) {
	return Math.sqrt(Math.pow(a,2) + Math.pow(b,2)).toFixed(2);
}

/**
 * @method distanceInKm
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
 * @method markerCluster
 * Process a set of markers and cluster them
 *
 * Each marker must be in this format:
 *
 * ```javascript
 * {
 * 	lat: 	{Number},
 * 	lng: 	{Number},
 * 	id: 	{Number (unique)}
 * }
 * ```
 * @param  {Object} e       	The arguments retrived from TiMap.addEventListener('regionchanged', **event**)
 * @param  {Object} markers 	The markers **must be** an instance of `Backbone.Collection` or an Object id-indexed
 * @param  {Object} [keys] 	The keys of the object to get informations. Default: `{ latitude: 'lat', longitude: 'lng', id: 'id' }`
 * @return {Array}
 * An array of markers in this format:
 *
 * If the marker is a cluster, an object like
 * `{ latitude: {Number}, longitude: {Number}, count: {Number} }` is passed,
 * otherwise, the ID of the marker in your marker collections.
 *
 * This is a sample code:
 *
 * ```
 * var Geo = T('geo');
 * var TiMap = require('ti.map');
 *
 * var Me = Alloy.createCollection('whatever');
 * Me.fetch({
 * 	success: function() {
 *			updateMap(_.extend($.mapView.region, { source: $.mapView }));
 *		 	$.mapView.addEventListener('regionchanged', updateMap);
 *	   }
 * });
 *
 * function updateMap(e) {
 * 	var data = Geo.markerCluster(e, Me);
 * 	var annotations = [];
 *
 * 	_.each(data, function(c){
 * 		if (_.isNumber(c)) {
 * 			var marker = Me.get(c);
 * 			annotations.push(TiMap.createAnnotation({
 * 				id: c,
 * 				latitude: marker.get('lat'),
 * 				longitude: marker.get('lng'),
 * 				title: marker.get('title'),
 * 			}));
 * 		} else {
 * 			annotations.push(TiMap.createAnnotation({
 * 				latitude: c.latitude,
 * 				longitude: c.longitude
 * 			}));
 * 		}
 * 	});
 *
 * 	$.mapView.annotations = annotations;
 * }
 *
 * ```
 *
 */
exports.markerCluster = function(e, markers, keys){
	_.defaults(keys, { latitude: 'lat', longitude: 'lng', id: 'id' });

	var c = {};
	var g = {};

	/* latR, lngR represents the current degrees visible */
	var latR = (e.source.size.height || Alloy.Globals.SCREEN_HEIGHT) / e.latitudeDelta;
	var lngR = (e.source.size.width || Alloy.Globals.SCREEN_WIDTH) / e.longitudeDelta;

	var degreeLat = 2 * config.pixelRadius/latR;
	var degreeLng = 2 * config.pixelRadius/lngR;

	var boundingBox = [
	e.latitude - e.latitudeDelta/2 - degreeLat,
	e.longitude + e.longitudeDelta/2 + degreeLng,
	e.latitude + e.latitudeDelta/2 + degreeLat,
	e.longitude - e.longitudeDelta/2 - degreeLng
	];

	var isBackbone = (markers instanceof Backbone.Collection);

	function removeOutOfBBFunction(m){
		var tmpLat = parseFloat( isBackbone ? m.get(keys.latitude) : m[keys.latitude] );
		var tmpLng = parseFloat( isBackbone ? m.get(keys.longitude) : m[keys.longitude] );
		if (tmpLat < boundingBox[2] && tmpLat > boundingBox[0] && tmpLng > boundingBox[3] && tmpLng < boundingBox[1]) {
			c[m[keys.id]] = { latitude: tmpLat, longitude: tmpLng };
		}
	}

	function createCObjFunction(m) {
		var tmpLat = parseFloat( isBackbone === true ? m.get(keys.latitude) : m[keys.latitude] );
		var tmpLng = parseFloat( isBackbone === true ? m.get(keys.longitude) : m[keys.longitude] );
		c[m.id] = { latitude: tmpLat, longitude: tmpLng };
	}


	// Start clustering

	if (isBackbone === true) {
		markers.map(config.clusterRemoveOutOfBB === true ? removeOutOfBBFunction : createCObjFunction);
	} else {
		_.each(markers, config.clusterRemoveOutOfBB === true ? removeOutOfBBFunction : createCObjFunction);
	}

	// Cycle over all markers, and group in {g} all nearest markers by {id}
	var zoomToCluster = e.longitudeDelta > config.clusterMaxDelta;
	_.each(c, function(a, id){
		_.each(c, function(b, jd){
			if (id == jd || zoomToCluster === false) return;
			var dst = dist(lngR * Math.abs(a.latitude - b.latitude), lngR * Math.abs(a.longitude - b.longitude));
			if (dst < config.pixelRadius) {
				if (!(id in g)) g[id] = [id];
				g[id].push(jd);
				delete c[jd];
			}
		});
		if (!(id in g)) g[id] = [id];
		delete c[id];
	});

	// cycle all over pin and calculate the average of group pin
	_.each(g, function(a, id){
		c[id] = { latitude: 0.0,  longitude: 0.0, count: _.keys(a).length };
		_.each(a, function(b){
			c[id].latitude += parseFloat(isBackbone ? markers.get(b).get(keys.latitude) : markers[b][keys.latitude]);
			c[id].longitude += parseFloat(isBackbone ? markers.get(b).get(keys.longitude) : markers[b][keys.longitude]);
		});
		c[id].latitude = c[id].latitude / c[id].count;
		c[id].longitude = c[id].longitude / c[id].count;
	});


	// Set all annotations
	var data = [];
	_.each(c, function(a, id){
		if (a.count > 1) {
			data.push({
				latitude: parseFloat(c[id].latitude.toFixed(2)),
				longitude: parseFloat(c[id].longitude.toFixed(2)),
				count: c[id].count
			});
		} else {
			data.push(+id);
		}
	});

	return data;
};


/**
 * @method checkForDependencies
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
	require('T/dialog').errorAlert(errorMessage, function(){
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=com.google.android.gms');
		Ti.Android.currentActivity.finish();
	});
};


/**
 * @method getRegionBounds
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


/*
Init
*/

Ti.Geolocation.accuracy = Ti.Geolocation[config.gpsAccuracy];
