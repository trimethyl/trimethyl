/**
 * @class  Event
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
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

module.exports = Backbone.Events;