/*

Map module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = _.extend({
	pixelRadius: 15,
	removeOutOfBB: true,
	maxDeltaToCluster: 0.3
}, Alloy.CFG.maputil);


function deg2rad(deg) {
	return deg * 0.017453;
	// return deg * (Math.PI/180);
}

function dist(a,b) {
	return Math.sqrt(Math.pow(a,2)+Math.pow(b,2)).toFixed(2);
}

exports.distanceInKm = function(lat1, lon1, lat2, lon2) {
	var dLat = deg2rad(lat2-lat1)/2;
	var dLon = deg2rad(lon2-lon1)/2;
	var a = Math.sin(dLat)*Math.sin(dLat) + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon)*Math.sin(dLon);
	return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

exports.cluster = function(e, markers){
	if (!(markers instanceof Backbone.Collection)) {
		throw 'Markers must be a Backbone Collection';
	}

	var c={}, g={};
	var id, jd, len, dst;

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
		markers.map(function(m){
			var lat = parseFloat(m.get('lat')), lng = parseFloat(m.get('lng'));
			if (lat<boundingBox[2] && lat>boundingBox[0] && lng>boundingBox[3] && lng<boundingBox[1]) {
				c[m.get('id')] = { lat: lat, lng: lng };
			}
		});
	} else {
		markers.map(function(m){
			var lat = parseFloat(m.get('lat')), lng = parseFloat(m.get('lng'));
			c[m.get('id')] = { lat: lat, lng: lng };
		});
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
	for (id in g) {
		c[id] = { lat: 0.0, lng: 0.0, count: Object.keys(g[id]).length };
		for (jd in g[id]) {
			c[id].lat += parseFloat(markers.get(g[id][jd]).get('lat'));
			c[id].lng += parseFloat(markers.get(g[id][jd]).get('lng'));
		}
		c[id].lat = c[id].lat/c[id].count;
		c[id].lng = c[id].lng/c[id].count;
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
};

exports.checkForDependencies = function() {
	if (!OS_ANDROID) {
		return false;
	}

	var $$ = require('ti.map');
	var rc = $$.isGooglePlayServicesAvailable();

	if (rc==$$.SUCCESS) {
		return true;
	}

	var errorMessage = null;
	switch (rc) {
		case $$.SERVICE_MISSING:
		errorMessage = L('geo_googleplayservices_missing', 'Google Play services is missing. Please install Google Play services from the Google Play store in order to use the application.');
		break;
		case $$.SERVICE_VERSION_UPDATE_REQUIRED:
		errorMessage = L('geo_googleplayservices_outdated', 'Google Play services is out of date. Please update Google Play services in order to use the application.');
		break;
		case $$.SERVICE_DISABLED:
		errorMessage = L('geo_googleplayservices_disabled', 'Google Play services is disabled. Please enable Google Play services in order to use the application.');
		break;
		case $$.SERVICE_INVALID:
		errorMessage = L('geo_googleplayservices_auth', 'Google Play services cannot be authenticated. Reinstall Google Play services in order to use the application.');
		break;
		default:
		errorMessage = L('geo_googleplayservices_error', 'Google Play services generated an uknown error. Reinstall Google Play services in order to use the application.');
		break;
	}

	require('util').alertError(errorMessage, function(){
		Ti.Platform.openURL('https://play.google.com/store/apps/details?id=com.google.android.gms');
		Ti.Android.currentActivity.finish();
	});
};