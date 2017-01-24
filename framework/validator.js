/**
 * @module  validator
 * @author  Ani Sinanaj <ani.sinanaj@caffeina.com>
 */

/**
 * @property config
 * @property {String} [config.email="/"] 	The driver to use
 */
exports.config = _.extend({
	email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	password: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/
}, Alloy.CFG.T ? Alloy.CFG.T.validator : {});

/**
 * isValid
 * @param type the type of the validation which maps to Alloy.CFG.T.validator[type]
 * @param value the value to test
 * @return boolean false if the type isn't defined
 */
exports.isValid = function(type, value) {
	if (!exports.config[type]) {
		Ti.API.warn("Validator type " + type + " not defined");
		return false;
	}
	return exports.config[type].test(value);
};