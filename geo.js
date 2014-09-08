/**
 * @class  	Geo
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Provide useful method for geolocation events
 *
 */

/**
 * * **accuracy**: Accuracy of Geo. Must be one of `"ACCURACY_HIGH"`, `"ACCURACY_LOW"`
 * * **useGoogleForGeocode**: Tell to use Google Services instead of Titanium geocoding services.
 * @type {Object}
 */
var config = _.extend({
	accuracy: "ACCURACY_HIGH",
	useGoogleForGeocode: true,
}, Alloy.CFG.geo);
exports.config = config;

function checkForServices() {
	return !!Ti.Geolocation.locationServicesEnabled;
}

/**
 * Alert the user that Location is off
 */
function enableServicesAlert(){
	if (OS_IOS) {
		require('T/util').alert(L('geo_error_title'), L('geo_error_msg'));
	} else {
		require('T/util').simpleAlert(L('geo_error_title'));
	}
}
exports.enableServicesAlert = enableServicesAlert;


/**
 * @deprecated: Use `@getPosition` instead.
 * @param {Function} callback
 */
function localize(callback) {
	Ti.API.warn("[DEPRECATED] The use of 'Geo.localize' is deprecated, use 'Geo.getPosition' instead!");
	getCurrentPosition({
		success: function(e){
			callback({ coords: e });
		},
		error: callback
	});
}
exports.localize = localize;

function decorateRequest(request) {
	if (request.decorated) return request;

	if (request.error===undefined) {
		request.error = function(e) {
			if (e.servicesDisabled) {
				enableServicesAlert();
			} else {
				require('T/util').simpleAlert(L('geo_error_title'));
			}
		};
	}

	request.decorated = true;
	return request;
}

/**
 * Get the current GPS coordinates of user using `Ti.Geolocation.getCurrentPosition`
 *
 * A `geo.start` event is fired at start, and a `geo.end` event is fired on end
 *
 * @param {Object} opt Dictionary for this request
 */
function getCurrentPosition(request) {
	request = decorateRequest(request);

	if (false===checkForServices()) {
		if (_.isFunction(request.error)) request.error({ servicesDisabled: true });
		return;
	}

	if (!request.silent) Ti.App.fireEvent('geo.start');

	Ti.Geolocation.getCurrentPosition(function(e){
		if (!request.silent) Ti.App.fireEvent('geo.end');

		if (e.error) {
			if (_.isFunction(request.error)) request.error({});
			return;
		}

		if (!_.isObject(e.coords)) {
			if (_.isFunction(request.error)) request.error({});
			return;
		}

		if (_.isFunction(request.success)) request.success(e.coords);
	});
}
exports.getCurrentPosition = getCurrentPosition;


/**
 * Open Apple Maps on iOS, Google Maps on Android and route from user location to defined location
 *
 * @param  {Number} lat  	Desination latitude
 * @param  {Number} lng  	Destination longitude
 * @param  {String} [mode] GPS mode used (walking,driving)
 */
function startNavigator(lat, lng, mode) {
	getCurrentPosition({
		success: function(g) {
			var D = OS_IOS ? "http://maps.apple.com/" : "https://maps.google.com/maps/";
			Ti.Platform.openURL(D + require('T/util').buildQuery({
				directionsmode: mode || 'walking',
				saddr: g.latitude + "," + g.longitude,
				daddr: lat + "," + lng
			}));
		}
	});
}
exports.startNavigator = startNavigator;


/**
 * Return the coordinates of an address
 *
 * If some errors occurs, the callback in invoked
 * anyway with `{ error: true, success: false }`
 *
 * @param  {String}   address 	The address to geocode
 * @param  {Function} cb      	The callback
 */
function geocode(address, cb) {
	if (config.useGoogleForGeocode) {

		require('T/net').send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			cache: false,
			data: {
				address: address,
				sensor: 'false'
			},
			mime: 'json',
			success: function(res){

				if (res.status!='OK' || !res.results.length) {
					cb({ error: true });
				} else {
					cb({
						success: true,
						latitude: res.results[0].geometry.location.lat,
						longitude: res.results[0].geometry.location.lng
					});
				}

			},
			error: function(err){
				Ti.API.error("Geo: "+err);
				cb({ error: true });
			}
		});

	} else {

		Ti.Geolocation.forwardGeocoder(address, function(res){

			if (!res.success) {
				cb({ error: true });
			} else {
				cb({
					success: true,
					latitude: res.latitude,
					longitude: res.longitude
				});
			}

		});
	}
}
exports.geocode = geocode;


/**
 * Return the address with the specified coordinates
 *
 * If some errors occurs, the callback in invoked
 * anyway with `{ error: true, success: false }`
 *
 * @param  {Number}   lat 	The latitude of the address
 * @param  {Number}   lng 	The longitude of the address
 * @param  {Function} cb  The callback
 */
function reverseGeocode(lat, lng, cb) {
	if (!lat || !lng) {
		return cb({ error: true });
	}

	if (config.useGoogleForGeocode) {

		require('T/net').send({
			url: 'http://maps.googleapis.com/maps/api/geocode/json',
			noCache: true,
			data: {
				latlng: lat+','+lng,
				sensor: 'false'
			},
			mime: 'json',
			success: function(res){

				if (res.status!='OK' || !res.results.length) {
					cb({ error: true });
				} else {
					cb({
						success: true,
						address: res.results[0].formatted_address,
						results: res.results
					});
				}

			},
			error: function(err){
				Ti.API.error("Geo: "+err);
				cb({ error: true });
			}
		});

	} else {

		Ti.Geolocation.reverseGeocoder(lat, lng, function(res){

			if (!res.success || !res.places || !res.places.length) {
				cb({ error: true });
			} else {
				cb({
					success: true,
					address: res.places[0].address,
					results: res.places
				});
			}

		});
	}
}
exports.reverseGeocode = reverseGeocode;

(function init(){

	Ti.Geolocation.purpose = L('geo_purpose');
	Ti.Geolocation.accuracy = Ti.Geolocation[config.accuracy];

})();
