/**
 * @class  	Event
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Event = _.extend({

	onWithObject: function(obj) {
		_.each(obj, function(fn, k) {
			Event.on(k, fn);
		});
	},

	offWithObject: function(obj) {
		_.each(obj, function(fn, k) {
			Event.off(k, fn);
		});
	}

}, Backbone.Events);

module.exports = Event;