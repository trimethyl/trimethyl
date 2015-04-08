/**
 * @class  	Router
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} config.protocol  Force all protocol different from this to be discarded
 */
exports.config = _.extend({
	protocol: null
}, Alloy.CFG.T ? Alloy.CFG.T.router : {});


var Util = require('T/util');
var Flow = require('T/flow');

var routeRegistry = [];

/**
 * @properties currentUrl
 * Latest URL dispatched
 * @type {String}
 */
exports.currentUrl = null;

/**
 * @properties currentRoute
 * Latest Route (not URL) dispatched
 * @type {Object}
 */
exports.currentRoute = null;

/**
 * @properties stack
 * All routes in a stack
 * @type {Array}
 */
exports.stack = [];

/**
 * @method on
 * Register a route with defined callbacks
 *
 * @param {Object} key The route name.
 * It can be:
 *
 * * `String`: (exact route match)
 * * `RegExp`: is evaluated with the argument and the matches are passed to the callback
 * * `Function`: must return a `non-undefined` value to be executed. That value is passed to the callback
 *
 * @param  {Function}	callback  		The callback
 */
exports.on = function(key, callback) {
	routeRegistry.push({
		key: key,
		callback: callback,
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
 * @param  {String} url 		The route
 */
exports.dispatch = function(url) {
	Ti.API.debug('Router: dispatching <' + url + '>');

	var callbackURL = Util.parseAsXCallbackURL(url);
	callbackURL.path = callbackURL.path.replace(/\/$/g, '');

	if (callbackURL.protocol && exports.config.protocol) {
		if (exports.config.protocol !== callbackURL.protocol) {
			Ti.API.warn('Router: protocol mismatch');
			return false;
		}
	}

	var run = false;
	var matches = null;

	// Check the route to dispatch
	for (var i in routeRegistry) {
		var routeDefinition = routeRegistry[i];

		if (_.isString(routeDefinition.key)) {

			// Regular string equals
			run = (routeDefinition.key === callbackURL.path);

		} else if (_.isRegExp(routeDefinition.key)) {

			// Regular expression complex match
			matches = callbackURL.path.match(routeDefinition.key);
			run = !!(matches);
			if (matches) matches.shift();

		} else if (_.isFunction(routeDefinition.key)) {

			// Function match
			matches = routeDefinition.key(callbackURL.path);
			run = (matches !== undefined);

		}

		if (run === true) {
			Ti.API.debug('Router: matched on <' + routeDefinition.key + ', ' + JSON.stringify(matches) + '>');

			var callback = routeDefinition.callback;
			if (_.isFunction(callback)) {

				exports.stack.push(url);
				exports.currentUrl = url;
				exports.currentRoute = routeDefinition;

				callback.apply(callbackURL, matches);

			} else if (_.isObject(callback)) {

				if (callback.alias != null) {
					exports.dispatch(callback.alias);
				}

			}

			return true;
		}
	}

	Ti.API.warn('Router: no match for <' + url + '>');
	return false;
};

/**
 * @method go
 * @inheritDoc #dispatch
 * Alias for {@link #dispatch}
 */
exports.go = exports.dispatch;

/**
 * Make an alias route
 * @param  {String} url
 * @param  {String} newUrl
 */
exports.alias = function(url, newUrl) {
	exports.on(url, {
		alias: newUrl
	});
};

/**
 * @method autoMapModel
 * Create the routes for a model
 * @param  {String} single The name for the model
 * @param  {String} [plural] The name for the model, plural.
 */
exports.autoMapModel = function(single, plural) {
	plural = plural || single+'s';

	exports.on('/' + plural, function() {
		Flow.open(plural, {}, {}, this.source);
	});

	exports.on(new RegExp('/' + plural + '/([0-9]+)'), function(id) {
		Flow.open(single, {
			id: id
		}, {}, this.source);
	});
};
