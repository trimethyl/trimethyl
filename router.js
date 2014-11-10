/**
 * @class  Router
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */


var Util = require('T/util');

var routes = []; // storage for all routes

/**
 * @method on
 * Register a route with defined callbacks
 *
 * @param  {String|RegExp|Function}   	key 			The route name.
 * It can be:
 *
 * * `String`: (exact route match)
 * * `RegExp`: is evaluated with the argument and the matches are passed to the callback
 * * `Function`: must return a `non-undefined` value to be executed. That value is passed to the callback
 *
 * @param  {Function}	callback  		The callback
 */
exports.on = function(key, callback) {
	routes.push({
		key: key,
		callback: callback
	});
};

/**
 * @method dispatch
 * Dispatch the router
 *
 * This function call the defined function with `Router.on`
 *
 * The param `this` represents an XCallback-URL Object for selected route.
 *
 * See https://github.com/FokkeZB/UTiL/blob/master/XCallbackURL/XCallbackURL.js for more details.
 *
 * The arguments passed are the matches for your regex definition (if present)
 *
 * @param  {String} 	url 		The route
 */
exports.dispatch = function(url) {
	var run = false;
	var matches = null;

	var X = Util.parseAsXCallbackURL(url);
	Ti.API.debug('Router: dispatching', url, X.path);

	for (var i in routes) {
		var routeDefinition = routes[i];

		if (_.isString(routeDefinition.key)) {
			// Regular string equals
			run = (routeDefinition.key === X.path);
		} else if (_.isRegExp(routeDefinition.key)) {
			// Regular expression complex match
			matches = X.path.match(routeDefinition.key);
			run = !!(matches);
			if (matches) matches.shift();
		} else if (_.isFunction(routeDefinition.key)) {
			// Function match
			matches = routeDefinition.key(X.path);
			run = (matches !== undefined);
		}

		if (run === true) {
			Ti.API.debug('Router: Matched with key ['+routeDefinition.key+'] and matches ['+JSON.stringify(matches)+']');

			routeDefinition.callback.apply(X, matches);
			return; // break the f***g cycle
		}
	}

	Ti.API.warn('Router: no matches for the selected route', url);
};

/**
 * @method go
 * @inheritDoc #dispatch
 * Alias for {@link #dispatch}
 */
exports.go = exports.dispatch;


/**
 * @method autoMapModel
 * Create the routes for a model
 * @param  {String} single The name for the model
 * @param  {String} [plural] The name for the model, plural.
 */
exports.autoMapModel = function(single, plural) {
	plural = plural || single+'s';

	exports.on('/' + plural, function() {
		require('T/flow').open(plural);
	});

	exports.on(new RegExp('/' + plural + '/([0-9]+)'), function(id) {
		require('T/flow').open(single, {
			id: id
		});
	});
};
