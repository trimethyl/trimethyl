/**
 * @module  uifactory/view
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var UIUtil = require('T/uiutil');

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createView(args);

	/**
	 * Set the cover image
	 * @method  setBackgroundCoverImage
	 * @param {String} url
	 */
	$this.setBackgroundCoverImage = function(url) {
		UIUtil.setBackgroundCoverForView($this, url, function(file) {
			$this.backgroundImage = file;
		});
	};

	/////////////////
	// Parse args //
	/////////////////

 	if (args.backgroundCoverImage != null) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	return $this;
};
