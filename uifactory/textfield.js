/**
 * @class  	UIFactory.TextField
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * * Removed the annoying autofocus on Android
 *
 */

function getDoneToolbar(opt) {
	var $doneBtn = Ti.UI.createButton({
		title: L('done', 'Done'),
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
		$this.keyboardToolbar = getDoneToolbar({
			done: function() {
				$this.blur();
			},
			cancel: function() {
				$this.blur();
			}
		});
	}

	return $this;
};