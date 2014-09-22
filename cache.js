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

module.exports = require('T/cache/'+config.driver);