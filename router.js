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

var __Routes = [];


/**
 * Register a route with defined callbacks
 *
 * @param  {String|RegExp|Function}   	key 			The route name.
 * It can be:
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
 * @param  {String} 	routeArg 		The route
 */
function dispatch(routeArg) {
	var run = false;
	var matches = null;

	for (var i in __Routes) {
		var routeDefinition = __Routes[i];

		if (_.isString(routeDefinition.key)) {
			run = (routeDefinition.key===routeArg);
		} else if (_.isRegExp(routeDefinition.key)) {
			matches = routeArg.match(routeDefinition.key);
			run = !!(matches);
			if (matches) matches.shift();
		} else if (_.isFunction(routeDefinition.key)) {
			matches = routeDefinition.key(routeArg);
			run = (matches!==undefined);
		}

		if (run) {
			Ti.API.debug("Router: Match found ("+routeDefinition.key.toString()+", "+JSON.stringify(matches)+"+)");
			return routeDefinition.callback.apply(null, matches);
		}
	}

	Ti.API.warn("Router: no matches for the selected route ("+routeArg+")");
}
exports.dispatch = dispatch;
