/**
 * @class  UIFactory.TextArea
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * * Add support for `hintText`, that is missing on iOS.
 * * Removed the annoying autofocus on Android
 *
 */

module.exports = function(args) {
	args = args || {};
	var $this = Ti.UI.createTextArea(args);

	function onTextAreaFocus() {
		if (_.isEmpty($this.getRealValue())) {
			$this.applyProperties({
				value: '',
				color: $this.color || '#000'
			});
		}
	}

	function onTextAreaBlur() {
		if (_.isEmpty($this.value)) {
			$this.applyProperties({
				value: $this.hintText,
				color: $this.hintTextColor || '#AAA'
			});
		} else {
			$this.color = $this.color || '#000';
		}
	}

	if (OS_IOS) {

		/**
		 * @method getRealValue
		 * Get the effective value when using hintText hack
		 * @return {String}
		 */
		$this.getRealValue = function(){
			if ($this.hintText === $this.value) return '';
			return $this.value;
		};

		$this.getHintText = function() {
			return $this.hintText;
		};

		$this.setHintText = function(val) {
			$this.hintText = val;
		};

	} else {

		$this.getRealValue = function(){
			return $this.value;
		};

	}


 	/*
 	==================================
 	PARSE ARGUMENTS AND INITIALIZATION
 	==================================
 	*/

 	if (OS_IOS && args.hintText != null) {
 		$this.setHintText(args.hintText);
 		$this.addEventListener('focus', onTextAreaFocus);
 		$this.addEventListener('blur', onTextAreaBlur);
 		onTextAreaBlur();
 	}

 	// Remove autofocus

	if (OS_ANDROID) {
		$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS);
		$this.addEventListener('touchstart',  function() {
			$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
		});
	}

	return $this;
};