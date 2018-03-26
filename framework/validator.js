/**
 * @module  validator
 * @author  Ani Sinanaj <ani.sinanaj@caffeina.com>
 */

var rules = {
	email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	password: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/
};

/**
 * isValid
 * @param type the type of the validation which maps to Alloy.CFG.T.validator[type]
 * @param value the value to test
 * @return boolean false if the type isn't defined
 */
exports.isValid = function(type, value) {
	if (!(type in rules)) {
		Ti.API.warn("Validator type " + type + " not defined");
		return false;
	}
	return rules[type].test(value);
};