/**
 * @class  	Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.strategy="database"] The default strategy
 */
exports.config = _.extend({
	strategy: 'database'
}, Alloy.CFG.T ? Alloy.CFG.T.cache : {});

// Driver loader
function load(name) {
	return require('T/cache/'+name);
}

module.exports = load(exports.config.strategy);