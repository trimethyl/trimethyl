/**
 * @class  	UIFactory.ImageView
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var UIUtil = require('T/uiutil');

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createImageView(args);

	/**
	 * @method setcoverImage
	 * @param {String} url
	 */
	$this.setCoverImage = function(url) {
		UIUtil.setBackgroundCoverForView($this, url, function(file) {
			$this.image = file;
		});
	};

	/////////////////
	// Parse args //
	/////////////////

 	if (args.coverImage != null) $this.setCoverImage(args.coverImage);

	return $this;
};
