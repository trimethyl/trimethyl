/**
 * @class  Router
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Routing system for the apps, used to manage flow from notifications, startups, direct routing.
 */

/**
 * * **trackWithGA**: Auto track the dispatched and resolved routes with GA
 * @type {Object}
 */
var config = _.extend({
	trackWithGA: false
}, Alloy.CFG.T.router);
exports.config = config;

var __Routes = [];
var XCallbackURL = require('T/ext/xcallbackurl');


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
	__Routes.push({ key: key, callback: callback });
}
exports.on = on;


/**
 * Dispatch the router
 *
 * This function call the defined function with `Router.on`
 *
 * The param `this` represents an XCallback-URL Object for selected route.
 *
 * See {@link https://github.com/FokkeZB/UTiL/blob/master/XCallbackURL/XCallbackURL.js} for more details.
 *
 * The arguments passed are the matches for your regex definition (if present)
 *
 * @param  {String} 	link 		The route
 */
function dispatch(link) {
	var run = false;
	var matches = null;

	var X = XCallbackURL.parse(link);
	var path = X.path();

	Ti.API.debug("Router: NEW Route", link, path);

	for (var i in __Routes) {
		var routeDefinition = __Routes[i];

		if (_.isString(routeDefinition.key)) {

			// Regular string equals
			run = (routeDefinition.key===path);

		} else if (_.isRegExp(routeDefinition.key)) {

			// Regular expression complex match
			matches = path.match(routeDefinition.key);
			run = !!(matches);
			if (matches) matches.shift();

		} else if (_.isFunction(routeDefinition.key)) {

			// Function match
			matches = routeDefinition.key(path);
			run = (matches!==undefined);

		}

		if (run) {
			Ti.API.debug("Router: Match found ("+routeDefinition.key.toString()+", "+JSON.stringify(matches)+")");
			if (config.trackWithGA) require('T/ga').trackScreen(link);

			routeDefinition.callback.apply(X, matches);

			return; // IS VERY IMPORTANT TO EXIT
		}
	}

	Ti.API.warn("Router: no matches for the selected route ("+link+")");
}
exports.dispatch = dispatch;

/**
 * @method go
 * @inheritDoc #dispatch
 * Alias for {@link #dispatch}
 */
exports.go = dispatch;
