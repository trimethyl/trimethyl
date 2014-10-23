/**
 * @class  UIFactory.TextField
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * * Removed the annoying autofocus on Android
 *
 */

function getDoneToolbar(opt) {
	var $doneBtn = Ti.UI.createButton({
		title: L('Done'),
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	$doneBtn.addEventListener('click', opt.done);

	return Ti.UI.iOS.createToolbar({
		borderTop: true,
		borderBottom: true,
		items:[
			Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }),
			$doneBtn
		]
	});
}

module.exports = function(args) {
	args = args || {};

	/**
	 * @property textType
	 * Can be
	 *
	 * * `email`
	 * * `password`
	 * * `passwordEye`
	 *
	 * to adjust the keyboard or the mask automatically.
	 * @type {String}
	 */
	switch (args.textType) {
		case 'number': args.keyboardType = Ti.UI.KEYBOARD_DECIMAL_PAD; break;
		case 'email': args.keyboardType = Ti.UI.KEYBOARD_EMAIL; break;
		case 'password': args.passwordMask = true; break;
		case 'passwordEye': args.passwordMask = true; break;
	}

	var $this = Ti.UI.createTextField(args);

	// Password Eye
	if (OS_IOS && args.textType === 'passwordEye') {
		var eyeButton = Ti.UI.createButton({
			image: args.passwordEyeImage,
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

	/**
	 * @property useDoneToolbar
	 * Add a default toolbar with a *Done* button that simply blur the TextField.
	 * @type {Boolean}
	 */
	if (OS_IOS && args.useDoneToolbar === true) {
		$this.keyboardToolbar = getDoneToolbar({
			done: function() {
				$this.blur();
			},
			cancel: function() {
				$this.blur();
			}
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