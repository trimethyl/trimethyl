/**
 * @class  Events
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * A simple proxy for Ti.App Events
 */

/**
 * @type {Object}
 */
var config = _.extend({}, Alloy.CFG.events);
exports.config = config;


var EVENTS = {};


/**
 * Adds the specified callback as an event listener for the named events
 *
 * @param {String}   key  The unique key
 * @param {Function} cb The callback
 */
function add(key, cb) {
	if (key in EVENTS) EVENTS[key].push(cb);
	else EVENTS[key] = [cb];
	Ti.App.addEventListener(key, cb);
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
 * @param {Function} cb The callback
 */
function rem(key, cb) {
	if (!(key in EVENTS)) return;
	_.each(EVENTS[key], function(loopCb, i){
		if (loopCb===cb || !loopCb) {
			Ti.App.removeEventListener(key, loopCb);
			EVENTS[key].splice(i);
		}
	});
}
exports.rem = rem;

/**
 * @method off
 * @inheritDoc #rem
 * Alias for  {@link #off}
 */
exports.off = rem;

/**
 * Fires a synthesized event to any registered listeners.
 *
 * @param  {String} key  The unique key
 * @param  {Object} [args] The arguments to pass to the event
 */
function fire(key, args) {
	Ti.App.fireEvent(key, args || {});
}
exports.fire = fire;

/**
 * @method trigger
 * @inheritDoc #fire
 * Alias for {@link #fire}
 */
exports.trigger = fire;