/**
 * @class  	UIFactory.View
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createView(args);

	/**
	 * @method setBackgroundCoverImage
	 * @param {String} url
	 */
	$this.setBackgroundCoverImage = function(url) {
		require('T/uiutil').setBackgroundCoverForView($this, url, $this.width, $this.height);
	};

	/*
 	==================================
 	PARSE ARGUMENTS AND INITIALIZATION
 	==================================
 	*/

 	if (args.backgroundCoverImage != null) $this.setBackgroundCoverImage(args.backgroundCoverImage);

	return $this;
};
