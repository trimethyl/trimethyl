/**
 * @class  MapUtil
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Map-related utilities, like clustering
 */

/**
 * * **pixelRadius**: The clustering radius expressed in PX. Default: `15`
 * * **removeOutofBB**: Tell the clustering to remove pins that are out of the bounding box. Default: `true`
 * * **maxDeltaToCluster**: The value before the clustering is off. Default: `0.3`
 * @type {Object}
 */
var config = _.extend({
	pixelRadius: 15,
	removeOutOfBB: true,
	maxDeltaToCluster: 0.3
}, Alloy.CFG.T.maputil);
exports.config = config;


function deg2rad(deg) {
	return deg * 0.017453; // return deg * (Math.PI/180); OPTIMIZE! :*
}

function dist(a,b) {
	return Math.sqrt(Math.pow(a,2)+Math.pow(b,2)).toFixed(2);
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
function distanceInKm(lat1, lon1, lat2, lon2) {
	var dLat = deg2rad(lat2-lat1)/2;
	var dLon = deg2rad(lon2-lon1)/2;
	var a = Math.sin(dLat)*Math.sin(dLat) + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon)*Math.sin(dLon);
	return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
exports.distanceInKm = distanceInKm;


/**
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
 * @return {Array}
 * An array of markers in this format:
 *
 * If the marker is a cluster, an object like
 * `{ latitude: {Number}, longitude: {Number}, count: {Number} }` is passed,
 * otherwise, the ID of the marker in your marker collections.
 */
function cluster(e, markers){
	var c={}, g={};
	var id, jd, len, dst;
	var tmpLat, tmpLng;

	/* latR, lngR represents the current degrees visible */
	var latR = (e.source.size.height || Alloy.Globals.SCREEN_HEIGHT) / e.latitudeDelta;
	var lngR = (e.source.size.width || Alloy.Globals.SCREEN_WIDTH) / e.longitudeDelta;

	var degreeLat = 2*config.pixelRadius/latR;
	var degreeLng = 2*config.pixelRadius/lngR;

	var boundingBox = [
	e.latitude - e.latitudeDelta/2 - degreeLat,
	e.longitude + e.longitudeDelta/2 + degreeLng,
	e.latitude + e.latitudeDelta/2 + degreeLat,
	e.longitude - e.longitudeDelta/2 - degreeLng
	];

	// Compile only marker in my bounding box
	if (config.removeOutOfBB) {

		if (markers instanceof Backbone.Collection) {
			markers.map(function(m){
				tmpLat = parseFloat(m.get('lat'));
				tmpLng = parseFloat(m.get('lng'));
				if (tmpLat<boundingBox[2] && tmpLat>boundingBox[0] && tmpLng>boundingBox[3] && tmpLng<boundingBox[1]) {
					c[m.get('id')] = { lat: tmpLat, lng: tmpLng };
				}
			});
		} else {
			_.each(markers, function(m){
				tmpLat = parseFloat(m.lat);
				tmpLng = parseFloat(m.lng);
				if (tmpLat<boundingBox[2] && tmpLat>boundingBox[0] && tmpLng>boundingBox[3] && tmpLng<boundingBox[1]) {
					c[m.id] = { lat: tmpLat, lng: tmpLng };
				}
			});
		}

	} else {

		if (markers instanceof Backbone.Collection) {
			markers.map(function(m){
				tmpLat = parseFloat(m.get('lat'));
				tmpLng = parseFloat(m.get('lng'));
				c[m.get('id')] = { lat: tmpLat, lng: tmpLng };
			});
		} else {
			_.each(markers, function(m){
				tmpLat = parseFloat(m.lat);
				tmpLng = parseFloat(m.lng);
				c[m.id] = { lat: tmpLat, lng: tmpLng };
			});
		}

	}

	// Cycle over all markers, and group in {g} all nearest markers by {id}
	var zoomToCluster = e.longitudeDelta>config.maxDeltaToCluster;
	for (id in c) {
		for (jd in c) {
			if (id==jd) continue;
			if (zoomToCluster) {
				dst = dist( lngR*Math.abs(c[id].lat-c[jd].lat), lngR*Math.abs(c[id].lng-c[jd].lng) );
				if (dst<config.pixelRadius) {
					if (!(id in g)) g[id] = [id];
					g[id].push(jd);
					delete c[jd];
				}
			}
		}
		if (!(id in g)) g[id] = [id];
		delete c[id];
	}

	// cycle all over pin and calculate the average of group pin

	if (markers instanceof Backbone.Collection) {
		for (id in g) {
			c[id] = { lat: 0.0, lng: 0.0, count: Object.keys(g[id]).length };
			for (jd in g[id]) {
				c[id].lat += parseFloat(markers.get(g[id][jd]).get('lat'));
				c[id].lng += parseFloat(markers.get(g[id][jd]).get('lng'));
			}
			c[id].lat = c[id].lat/c[id].count;
			c[id].lng = c[id].lng/c[id].count;
		}
	} else {
		for (id in g) {
			c[id] = { lat: 0.0, lng: 0.0, count: Object.keys(g[id]).length };
			for (jd in g[id]) {
				c[id].lat += parseFloat(markers[g[id][jd]].lat);
				c[id].lng += parseFloat(markers[g[id][jd]].lng);
			}
			c[id].lat = c[id].lat/c[id].count;
			c[id].lng = c[id].lng/c[id].count;
		}
	}

	// Set all annotations
	var data = [];
	for (id in c) {
		if (c[id].count>1) {
			data.push({
				latitude: c[id].lat.toFixed(2),
				longitude: c[id].lng.toFixed(2),
				count: c[id].count
			});
		} else {
			data.push(+id);
		}
	}

	return data;
}
exports.cluster = cluster;


/**
 * Check if the Google Play Services are installed and updated, otherwise Maps doesn't work and the app crashes.
 *
 * It the check fail, an error is displayed that redirect to the Play Store, and the app is terminated.
 *
 * On iOS, this check simply return true
 *
 */
function checkForDependencies() {
	if (!OS_ANDROID) {
		return false;
	}

	var TiMap = require('ti.map');
	var rc = TiMap.isGooglePlayServicesAvailable();

	if (rc==TiMap.SUCCESS) {
		return true;
	}

	var errorMessage = null;
	switch (rc) {
		case TiMap.SERVICE_MISSING:
		errorMessage = L('geo_googleplayservices_missing', 'Google Play services is missing. Please install Google Play services from the Google Play store in order to use the application.');
		break;
		case TiMap.SERVICE_VERSION_UPDATE_REQUIRED:
		errorMessage = L('geo_googleplayservices_outdated', 'Google Play services is out of date. Please update Google Play services in order to use the application.');
		break;
		case TiMap.SERVICE_DISABLED:
		errorMessage = L('geo_googleplayservices_disabled', 'Google Play services is disabled. Please enable Google Play services in order to use the application.');
		break;
		case TiMap.SERVICE_INVALID:
		errorMessage = L('geo_googleplayservices_auth', 'Google Play services cannot be authenticated. Reinstall Google Play services in order to use the application.');
		break;
		default:
		errorMessage = L('geo_googleplayservices_error', 'Google Play services generated an uknown error. Reinstall Google Play services in order to use the application.');
		break;
	}

	require('T/util').alertError(errorMessage, function(){
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=com.google.android.gms');
		Ti.Android.currentActivity.finish();
	});
}
exports.checkForDependencies = checkForDependencies;