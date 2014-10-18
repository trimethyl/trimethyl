/**
 * @class  Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * Cache Interface
 *
 */

/**
 * `strategy` The default strategy. Default `database`
 * @type {Object}
 */
var config = _.extend({
	strategy: 'database'
}, Alloy.CFG.T.cache);
exports.config = config;

module.exports = require('T/cache/'+config.strategy);