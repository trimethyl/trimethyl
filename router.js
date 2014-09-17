/**
 * @class  Router
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Routing system for the apps, used to manage flow from notifications, startups, direct routing.
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.router);
exports.config = config;

var routes = [];

var Util = require('T/util');

/**
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
function on(key, callback) {
	routes.push({
		key: key,
		callback: callback
	});
}
exports.on = on;


/**
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
 * @param  {String} 	link 		The route
 */
function dispatch(link) {
	var run = false;
	var matches = null;

	var X = Util.parseAsXCallbackURL(link);
	var path = X.path();

	Ti.API.debug('Router: NEW Route', link, path);

	for (var i in routes) {
		var routeDefinition = routes[i];

		if (_.isString(routeDefinition.key)) {
			// Regular string equals
			run = (routeDefinition.key === path);
		} else if (_.isRegExp(routeDefinition.key)) {
			// Regular expression complex match
			matches = path.match(routeDefinition.key);
			run = !!(matches);
			if (matches) matches.shift();
		} else if (_.isFunction(routeDefinition.key)) {
			// Function match
			matches = routeDefinition.key(path);
			run = (matches !== undefined);
		}

		if (run === true) {
			Ti.API.debug('Router: Match found', routeDefinition.key, matches);

			routeDefinition.callback.apply(X, matches);
			return; // break the f***g cycle
		}
	}

	Ti.API.warn('Router: no matches for the selected route', link);
}
exports.dispatch = dispatch;

/**
 * @method go
 * @inheritDoc #dispatch
 * Alias for {@link #dispatch}
 */
exports.go = dispatch;
