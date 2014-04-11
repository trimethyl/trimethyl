/*

Map module
Author: Flavio De Stefano
Company: Caffeina SRL

*/

var config = {
	pixelRadius: 15,
	removeOutOfBB: true,
	maxDeltaToCluster: 0.3
};

exports.dist = dist = function(a,b) {
	return Math.sqrt(Math.pow(a,2)+Math.pow(b,2)).toFixed(2);
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


exports.init = function(c) {
	config = _.extend(config, c);
};

