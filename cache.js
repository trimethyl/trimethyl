/**
 * @class  Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * Fast cache module using SQLite
 */

/**
 * @type {Object}
 */
var config = _.extend({
	driver: 'database'
}, Alloy.CFG.T.cache);
exports.config = config;


/**
 * Require the selected driver
 *
 * @param  {String} driver The driver
 * @return {Object}
 */
function setInterface(driver) {
	module.exports = require('T/cache/'+driver);
}
exports.setDriver = setDriver;


/*
Init
*/

setInterface(config.driver);
