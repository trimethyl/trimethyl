/**
 * @module  uifactory/textarea
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * * Add support for `hintText`, that is missing on iOS.
 *
 */

var UIUtil = require('T/uiutil');

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
		 * Get the effective value when using hintText hack
		 * @return {String}
		 */
		$this.getRealValue = function(){
			if ($this.hintText === $this.value) return '';
			return $this.value;
		};

		/**
		 * Set the real value when using hintText hack
		 */
		$this.setRealValue = function(v){
			$this.value = v;
			onTextAreaBlur({
				source: $this
			});
		};

		$this.getHintText = function() {
			return $this.hintText;
		};

		$this.setHintText = function(val) {
			$this.hintText = val;
		};

	} else {

		$this.setRealValue = function(v){
			$this.value = v;
		};

		$this.getRealValue = function(){
			return $this.value;
		};

	}


	//////////////////////
	// Parse arguments //
	//////////////////////

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

	if (OS_IOS && args.hintText != null) {
		$this.realColor = args.color || '#000';
		$this.hintText = args.hintText;

		$this.addEventListener('focus', onTextAreaFocus);
		$this.addEventListener('blur', onTextAreaBlur);

		onTextAreaBlur({ source: $this });
	}

	return $this;
};