/**
 * @class  	Cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

/**
 * @property config
 * @property {String} [config.driver="database"] 	The driver to use
 */
exports.config = _.extend({
	driver: 'database'
}, Alloy.CFG.T ? Alloy.CFG.T.cache : {});

module.exports = Alloy.Globals.Trimethyl.loadDriver('cache', exports.config.driver, {

	get: function(hash) {},
	set: function(hash, value) {},
	remove: function(hash) {}
	purge: function(hash) {},

});