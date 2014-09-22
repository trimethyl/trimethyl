/**
 * @class  Event
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * An event dispatcher based on `Backbone.Events`
 *
 * Completely disassociated from Ti.App.addEventListener / Ti.App.removeEventListener,
 *
 * This article will explain you why: `http://www.tidev.io/2014/09/10/the-case-against-ti-app-fireevent-2/`
 */

/**
 * @type {Object}
 */
var config = _.extend({
}, Alloy.CFG.T.event);
exports.config = config;

/*
Init
*/

module.exports = _.clone(Backbone.Events);