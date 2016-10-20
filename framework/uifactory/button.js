/**
 * @module  uifactory/button
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createButton(args);

	//////////////////////
	// Parse arguments //
	//////////////////////

	return $this;
};