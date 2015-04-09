/**
 * @class  	UIFactory.TextField
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var UIUtil = require('T/uiutil');

module.exports = function(args) {
	_.defaults(args, {

		/**
		 * @property {String} textType
		 * Can be
		 *
		 * * `email`
		 * * `password`
		 * * `passwordEye`
		 *
		 * to adjust the keyboard or the mask automatically.
		 */
		textType: 'text',

		/**
		 * @property {Boolean} [useDoneToolbar=false] Add a default toolbar with a *Done* button that simply blur the TextField.
		 */
		useDoneToolbar: false,
	});


	switch (args.textType) {

		case 'number':
		args.keyboardType = Ti.UI.KEYBOARD_DECIMAL_PAD;
		break;

		case 'email':
		args.keyboardType = Ti.UI.KEYBOARD_EMAIL;
		args.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_NONE;
		args.autocorrect = false;
		break;

		case 'password':
		args.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_NONE;
		args.autocorrect = false;
		args.passwordMask = true;
		break;

		case 'passwordEye':
		args.autocapitalization = Ti.UI.TEXT_AUTOCAPITALIZATION_NONE;
		args.autocorrect = false;
		args.passwordMask = true;
		break;
	}

	var $this = Ti.UI.createTextField(args);


	//////////////////////
	// Parse arguments //
	//////////////////////

	// Password Eye
	if (OS_IOS && args.textType === 'passwordEye') {
		var $eyeButton = Ti.UI.createButton({
			image: args.passwordEyeImage || '/images/T/eye.png',
			height: 40,
			width: 40,
			opacity: 0.2,
			active: false,
			tintColor: $this.color
		});
		$this.setRightButton($eyeButton);
		$this.setRightButtonMode(Ti.UI.INPUT_BUTTONMODE_ALWAYS);

		$eyeButton.addEventListener('click', function(){
			$eyeButton.active = !$eyeButton.active;
			$eyeButton.opacity = $eyeButton.active ? 1 : 0.2;
			$this.setPasswordMask(!$eyeButton.active);
		});
	}


	if (OS_IOS && args.useDoneToolbar === true) {
		$this.keyboardToolbar = UIUtil.buildKeyboardToolbar({
			done: function() {
				$this.fireEvent('toolbar.done');
				$this.blur();
			},
			cancel: function() {
				$this.fireEvent('toolbar.cancel');
				$this.blur();
			}
		});
	}

	return $this;
};