/**
 * @class  UIFactory.TextField
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * ## Creation properties
 *
 * #### `textType`
 *
 * Can be
 *
 * * `email`
 * * `password`
 * * `passwordEye`
 *
 * to adjust the keyboard or the mask automatically.
 *
 * ## Android Fixes
 *
 * * Removed the annoying autofocus on Android.
 *
 */

module.exports = function(args) {
	args = args || {};

	switch (args.textType) {
		case 'email': args.keyboardType = Ti.UI.KEYBOARD_EMAIL; break;
		case 'password': args.passwordMask = true; break;
		case 'passwordEye': args.passwordMask = true; break;
	}

	var $this = Ti.UI.createTextField(args);


	// PasswordEye
	// ===============================

	if (OS_IOS && args.textType === 'passwordEye') {
		var eyeButton = Ti.UI.createButton({
			image: '/images/T/eye.png',
			height: 40, width: 40,
			opacity: 0.2,
			active: false,
			tintColor: $this.color
		});
		$this.setRightButton(eyeButton);
		$this.setRightButtonPadding(0);
		$this.setRightButtonMode(Ti.UI.INPUT_BUTTONMODE_ALWAYS);

		eyeButton.addEventListener('click', function(){
			eyeButton.active = !eyeButton.active;
			eyeButton.opacity = eyeButton.active ? 1 : 0.2;
			$this.setPasswordMask(!eyeButton.active);
		});
	}


	// ==================================
	// PARSE ARGUMENTS AND INITIALIZATION
	// ==================================

	// Remove autofocus

	if (OS_ANDROID) {
		$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_HIDE_ON_FOCUS);
		$this.addEventListener('touchstart',  function() {
			$this.setSoftKeyboardOnFocus(Ti.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS);
		});
	}

	return $this;
};