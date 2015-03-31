/**
 * @class  	UIFactory.TextArea
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * * Add support for `hintText`, that is missing on iOS.
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

function onTextAreaFocus(e) {
	if (_.isEmpty(e.source.getRealValue())) {
		e.source.applyProperties({
			value: '',
			color: e.source.realColor
		});
	}
}

function onTextAreaBlur(e) {
	if (_.isEmpty(e.source.value)) {
		e.source.applyProperties({
			value: e.source.hintText,
			color: e.source.hintTextColor || '#AAA'
		});
	} else {
		e.source.color = e.source.realColor;
	}
}

module.exports = function(args) {
	_.defaults(args, {

		/**
		 * @property {Boolean} [useDoneToolbar=false] Add a default toolbar with a *Done* button that simply blur the TextField.
		 */
		useDoneToolbar: false,

	});

	var $this = Ti.UI.createTextArea(args);

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

		/**
		 * @method setRealValue
		 * Set the real value when using hintText hack
		 */
		$this.setRealValue = function(v){
			$this.value = v;
			$this.color = $this.realColor;
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


	//////////////////////
 	// Parse arguments //
	//////////////////////

	if (OS_IOS && args.useDoneToolbar == true) {
		$this.keyboardToolbar = getDoneToolbar({
			done: function() {
				$this.blur();
			},
			cancel: function() {
				$this.blur();
			}
		});
	}

 	if (OS_IOS && args.hintText != null) {
 		$this.realColor = args.color || '#000';
 		$this.hintText = args.hintText;

 		$this.addEventListener('focus', onTextAreaFocus);
 		$this.addEventListener('blur', onTextAreaBlur);

 		onTextAreaBlur({ source: $this });
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