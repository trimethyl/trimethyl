/**
 * @class  	UIFactory.View
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var UIUtil = require('T/uiutil');

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createView(args);

	/**
	 * @method setBackgroundCoverImage
	 * @param {String} url
	 */
	$this.setBackgroundCoverImage = function(url) {
		return UIUtil.setBackgroundCoverForView($this, url);
	};

	/////////////////
	// Parse args //
	/////////////////

 	if (args.backgroundCoverImage != null) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	return $this;
};
