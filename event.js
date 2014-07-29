/**
 * @class  Event
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * An event manager completely disassociated for Ti.App.addEventListener / Ti.App.removeEventListener
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.T.events);
exports.config = config;

var __Events = {};


/**
 * Adds the specified callback as an event listener for the named events
 *
 * @param {String}   key  The unique key
 * @param {Function} cb The callback
 */
function add(key, cb) {
	if (key in __Events) __Events[key].push(cb);
	else __Events[key] = [cb];
}
exports.add = add;

/**
 * @method on
 * @inheritDoc #add
 * Alias for {@link #add}
 */
exports.on = add;

/**
 * Removes the specified callback as an event listener for the named event.
 *
 * If no callback is specified, all listener for that key were removed
 *
 * @param {String}   key  The unique key
 * @param {Function} [cb] The callback
 */
function rem(key, cb) {
	if (!(key in __Events)) return;

	if (_.isFunction(cb)) {
		_.each(__Events[key], function(fun, i){
			if (fun===cb) __Events[key].splice(i);
		});
	} else {
		delete __Events[key];
	}
}
exports.rem = rem;

/**
 * @method off
 * @inheritDoc #rem
 * Alias for  {@link #off}
 */
exports.off = rem;


/**
 * Shortcut for Event.off(key); Event.on(key, cb);
 *
 * @param  {String}   key The unique key
 * @param  {Function} cb  The callback
 */
function remThenAdd(key, cb) {
	rem(key);
	add(key, cb);
}
exports.remThenAdd = remThenAdd;

/**
 * @method offThenOn
 * @inheritDoc #remThenAdd
 * Alias for  {@link #off}
 */
exports.offThenOn = remThenAdd;


/**
 * Fires a synthesized event to any registered listeners.
 *
 * @param  {String} 		key  		The unique key
 * @param  {Arguments}	[...] 	The arguments to pass to the event
 */
function fire() {
	var key = Array.prototype.shift.call(arguments);
	if (!(key in __Events)) {
		Ti.API.warn("Events: No listener found for "+key);
	}

	_.each(__Events[key], function(fun) {
		fun.apply(null, arguments);
	});
}
exports.fire = fire;

/**
 * @method trigger
 * @inheritDoc #fire
 * Alias for {@link #fire}
 */
exports.trigger = fire;