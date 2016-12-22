/**
 * @module  uifactory/textfield
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

		case 'phone':
		args.keyboardType = Ti.UI.KEYBOARD_TYPE_PHONE_PAD;
		break;

		case 'email':
		args.keyboardType = Ti.UI.KEYBOARD_TYPE_EMAIL;
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
			width: 60,
			top: 0,
			right: 0,
			bottom: 0,
			opacity: 0.2,
			active: false,
			tintColor: $this.color
		});
		$this.applyProperties({
			rightButtonPadding: 0,
			rightButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
			rightButton: $eyeButton
		});
		$eyeButton.addEventListener('click', function(){
			$eyeButton.active = !$eyeButton.active;
			$eyeButton.opacity = $eyeButton.active ? 1 : 0.2;
			$this.passwordMask = !$eyeButton.active;
			$this.value = _.clone($this.value); // this fix a strange font-change behaviour
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
