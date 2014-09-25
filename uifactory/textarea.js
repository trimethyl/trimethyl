/**
 * @class  UIFactory.TextArea
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * ## iOS Fixes
 *
 * Add support for `hintText`, that is missing on iOS.
 *
 * ### New methods
 *
 * #### getRealValue()
 *
 * Get the effective value when using hintText hack
 *
 * ## Android Fixes
 *
 * Removed the annoying autofocus.
 *
 */

module.exports = function(args) {
	args = args || {};

	var $this = Ti.UI.createTextArea(args);

	var originalColor = $this.color || '#000';

	var onTextAreaFocus = function() {
		if (_.isEmpty($this.getRealValue())) {
			$this.applyProperties({
				value: '',
				color: originalColor
			});
		}
	};

	var onTextAreaBlur = function() {
		if (_.isEmpty($this.value)) {
			$this.applyProperties({
				value: $this.hintText,
				color: $this.hintTextColor || '#AAA'
			});
		} else {
			$this.color = originalColor;
		}
	};

	if (OS_IOS) {

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