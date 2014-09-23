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

function use(what) {
	return require('T/cache/'+what);
}

module.exports = _.extend(use(config.driver), {
	use: use
});
