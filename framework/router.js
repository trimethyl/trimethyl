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
var Q = require('T/ext/q');

var routeRegistry = [];


/**
 * @property currentUrl
 * Latest URL dispatched
 * @type {String}
 */
exports.currentUrl = null;

/**
 * @property currentRoute
 * Latest Route (not URL) dispatched
 * @type {Object}
 */
exports.currentRoute = null;

/**
 * @property stack
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
exports.on = function() {
	var middlewares = _.toArray(arguments);
	var key = middlewares.shift();
	var callback = middlewares.pop();

	routeRegistry.push({
		key: key,
		callback: callback,
		middlewares: middlewares
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
	var routeDefinition = null;

	// Check the route to dispatch
	for (var i in routeRegistry) {
		routeDefinition = routeRegistry[i];

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

		if (run === true) break;
	}

	if (run === true) {
		Ti.API.debug('Router: matched on <' + routeDefinition.key + ', ' + JSON.stringify(matches) + '>');

		if (_.isFunction(routeDefinition.callback)) {

			exports.stack.push(url);
			exports.currentUrl = url;
			exports.currentRoute = routeDefinition;

			if (routeDefinition.middlewares.length > 0) {
				routeDefinition.middlewares.reduce(Q.when, Q()).then(function() {
					routeDefinition.callback.apply(callbackURL, matches);
				});
			} else {
				routeDefinition.callback.apply(callbackURL, matches);
			}

		} else if (_.isObject(routeDefinition.callback)) {

			if (routeDefinition.callback.alias != null) {
				exports.dispatch(routeDefinition.callback.alias);
			}

		}
	} else {
		Ti.API.warn('Router: no match for <' + url + '>');
	}

	return run;
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
