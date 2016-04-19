/**
 * @module  event
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Event = _.extend({

	/**
	 * @method onWithObject
	 * @param  {Object} obj
	 */
	onWithObject: function(obj) {
		_.each(obj, function(fn, k) {
			Event.on(k, fn);
		});
	},

	/**
	 * @method offWithObject
	 * @param  {Object} obj
	 */
	offWithObject: function(obj) {
		_.each(obj, function(fn, k) {
			Event.off(k, fn);
		});
	}

}, Backbone.Events);

module.exports = Event;