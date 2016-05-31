/**
 * @module  uifactory/timeselect
 * @author  Andrea Jonus <andrea.jonus@caffeina.com>
 */

var Moment = require('alloy/moment');
var Util = require('T/util');
var Dialog = require('T/dialog');

var Data = {};

var PICKER_WIDTH_IPHONE = Alloy.Globals.SCREEN_WIDTH;
var PICKER_HEIGHT_IPHONE = 216;

var PICKER_WIDTH_IPAD = 320;
var PICKER_HEIGHT_IPAD = 216;

function createTiUIPicker($this, opt) {
	var $picker = Ti.UI.createPicker(_.extend({}, opt, {
		value: $this.getValue(),
		type: Ti.UI.PICKER_TYPE_TIME,
	}));

	return $picker;
}

// Get the two buttons in the toolbar
function UIPickerButtons($this, $picker, callbacks) {
	var $doneBtn = Ti.UI.createButton({ title: L('done', 'Done') });
	$doneBtn.addEventListener('click', function() {
		$this.setValue($picker.value);

		callbacks.done();
	});

	var $cancelBtn = Ti.UI.createButton({ title: L('cancel', 'Cancel') });
	$cancelBtn.addEventListener('click', function() {
		callbacks.cancel();
	});

	return {
		done: $doneBtn,
		cancel: $cancelBtn
	};
}

var UIPickers = {

	// Show the picker in a Window that slide in from the bottom
	iphone: function($this) {
		var $picker = createTiUIPicker($this, {
			width: PICKER_WIDTH_IPHONE,
			height: PICKER_HEIGHT_IPHONE
		});

		var buttons = UIPickerButtons($this, $picker, {
			cancel: function() {
				$this.fireEvent('cancel');
				$pickerModal.close();
			},
			done: function() {
				$pickerModal.close();
			}
		});

		var $toolbar = Ti.UI.iOS.createToolbar({
			items: [
				buttons.cancel,
				Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }),
				buttons.done
			],
			borderTop: true,
			borderBottom: false
		});

		var $containerView = Ti.UI.createView({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
			layout: 'vertical',
			bottom: 0,
			transform: Ti.UI.create2DMatrix().translate(0, 300)
		});
		$containerView.add($toolbar);
		$containerView.add($picker);

		var $pickerModal = Ti.UI.createWindow({
			backgroundColor: '#4000',
		});
		$pickerModal.add($containerView);

		$pickerModal.addEventListener('open', function(e) {
			$picker.fireEvent('visible');
		});

		$pickerModal.open();

		$containerView.animate({
			transform: Ti.UI.create2DMatrix()
		});
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this) {
		var $picker = createTiUIPicker($this, {
			width: PICKER_WIDTH_IPAD
		});
		var has_value = false;

		var buttons = UIPickerButtons($this, $picker, {
			cancel: function() {
				has_value = false;
				$popover.hide();
			},
			done: function() {
				has_value = true;
				$popover.hide();
			}
		});

		var $containerWindow = Ti.UI.createWindow({
			leftNavButton: buttons.cancel,
			rightNavButton: buttons.done,
			title: $this.hintText,
			navTintColor: $this.tintColor
		});
		$containerWindow.add($picker);

		$containerWindow.addEventListener('open', function(e) {
			$picker.fireEvent('visible');
		});

		$containerWindow.addEventListener('close', function(e) {
			if (!has_value) {
				$this.fireEvent('cancel');
			}
		});

		var $navigator = Ti.UI.iOS.createNavigationWindow({
			window: $containerWindow,
			width: PICKER_WIDTH_IPAD,
			height: PICKER_HEIGHT_IPAD + 40, // 40 is the toolbar height
		});

		var $popover = Ti.UI.iPad.createPopover({
			contentView: $navigator
		});

		$popover.show({
			view: $this
		});
	},

	android: function($this) {
		Ti.UI.createPicker({
			type: Ti.UI.PICKER_TYPE_TIME
		}).showTimePickerDialog(_.extend(_.pick($this, 'format24', 'value'), {
			value: $this.getValue(),
			callback: function(e) {
				if (e.value == null || e.cancel) return;
				Data[ $this._uid ].value = e.value;
				$this.updateUI();
			}
		}));
	}

};


function dataPickerInterface(opt) {
	var self = {
		value: opt.value || new Date()
	};

	return self;
}

module.exports = function(args) {
	args = _.defaults(args || {}, {

		/**
		 * @property {String} [dateFormat='HH:mm'] The time format to display.
		 * @see {@link http://momentjs.com/docs/#/displaying/format/}
		 */
		timeFormat: 'HH:mm',

		/**
		 * @property {Date} [value=null] The date object to use as the time value.
		 */
		value: null,

		/**
		 * @property {Boolean} [format24=true] **(Android only)** Determines whether the Time pickers display in 24-hour or 12-hour clock format.
		 */
		format24: true,

		/**
		 * @property {String} [hintText=''] The text to display when no value is selected.
		 */
		hintText: '',

		/**
		 * @property {String} [tintColor=null] **(iOS only)** The tint color for the toolbar buttons of the picker.
		 */
		tintColor: null

	});

	args._uid = _.uniqueId();

	// Create a unique interface
	Data[ args._uid ] = dataPickerInterface({
		value: args.value
	});

	delete args.value;

	// Start UI

	var $this = null;
	_.defaults(args, {
		height: 48,
		width: Ti.UI.FILL
	});

	$this = Ti.UI.createLabel(args);

	$this.addEventListener('click', function(){
		$this.open();
	});

	$this.updateUI = function(trigger) {
		var val = $this.getValue();

		if (trigger !== false) {
			$this.fireEvent('change', {
				value: val,
				source: $this
			});
		}

		$this.text = val ? Moment(val).format($this.timeFormat) : ($this.hintText);
	};

	/**
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		return Data[ $this._uid ].value;
	};

	/**
	 * @param {Object} value
	 * Set the current value
	 * Shorthand for setColumnsValues with a single columns picker
	 */
	$this.setValue = function(value) {
		Data[ $this._uid ].value = value;

		$this.updateUI();
	};

	/**
	 * Get the internal data interface
	 */
	$this.getDataInterface = function() {
		return Data[ $this._uid ];
	};

	/**
	 * Open the picker
	 */
	$this.open = function() {
		UIPickers[ Ti.Platform.osname ]($this);
	};

	// Update the UI
	$this.updateUI(false);

	return $this;
};
