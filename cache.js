/**
 * @class  Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * `strategy` The default strategy. Default `database`
 * @type {Object}
 */
var config = _.extend({
	strategy: 'database'
}, Alloy.CFG.T.cache);
exports.config = config;

// Driver loader
function load(name) {
	return require( /\//.test(name) ? name : ('T/cache/'+name) );
}

module.exports = load(config.strategy);