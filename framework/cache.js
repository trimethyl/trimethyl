/**
 * @module  cache
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Alloy = require('alloy');
var _ = require('alloy/underscore')._;

/**
 * @property config
 * @property {String} [config.driver="sqlite"] The driver to use. Possibile values: "sqlite", "prop"
 */
exports.config = _.extend({
	driver: 'sqlite'
}, Alloy.CFG.T ? Alloy.CFG.T.cache : {});

function loadDriver(name) {
	return Alloy.Globals.Trimethyl.loadDriver('cache', name, {
		get: function(hash) {},
		set: function(hash, value, ttl) {},
		remove: function(hash) {},
		purge: function(hash) {},
	});
}

module.exports = loadDriver(exports.config.driver);
module.exports.loadDriver = loadDriver;