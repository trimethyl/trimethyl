/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('T/ext/moment');

function createTiUIPicker($this) {
	var $picker = null;

	if ($this.type === 'plain') {

		var pickerArgs = {};
		if (OS_IOS) {
			pickerArgs.width = Ti.UI.FILL;
		} else if (OS_ANDROID) {
			pickerArgs = _.extend({}, $this, {
				type: Ti.UI.PICKER_TYPE_PLAIN,
				value: $this.theValue
			});
		}

		$picker = Ti.UI.createPicker(pickerArgs);

		// Cycle over values and row
		$picker.add(_.map($this.interface.values, function(o) {
			return Ti.UI.createPickerRow(o);
		}));

		// Set current value
		$picker.setSelectedRow(0, $this.selectedIndex || 0, false);

		$picker.addEventListener('change', function(e) {
			$picker.theRow = e.row;
		});

	} else if ($this.type === 'date') {

		$picker = Ti.UI.createPicker(_.extend({}, _.pick($this, 'theValue', 'minDate', 'maxDate'), {
			value: $this.theValue,
			width: Ti.UI.FILL,
			type: Ti.UI.PICKER_TYPE_DATE
		}));

		$picker.addEventListener('change', function(e) {
			$this.theValue = e.value;
		});

	}

	return $picker;
}

// When a value change
function onValueSelected($this, $picker) {
	var row = $picker.theRow;

	$this.theValue = row.value;
	$this.selectedIndex = row.index;

	if ($this.type === 'plain') {
		$this.text = row.title;
	} else if ($this.type === 'date') {
		$this.text = Moment($this.theValue).format($this.dateFormat);
	}
}

// Get the two buttons in the toolbar
function getPickerButtons($this, $picker, closeCallback) {
	var $doneBtn = Ti.UI.createButton({ title: L('done', 'Done'), });

	$doneBtn.addEventListener('click', function() {
		onValueSelected($this, $picker);
		closeCallback();
	});

	var $cancelBtn = Ti.UI.createButton({ title: L('cancel', 'Cancel'), });
	$cancelBtn.addEventListener('click', function() {
		$picker.canceled = true;
		closeCallback();
	});

	return {
		done: $doneBtn,
		cancel: $cancelBtn
	};
}

var UIPickers = {

	// Show the picker in a Window that slide in from the bottom
	iphone: function($this) {
		var $picker = createTiUIPicker($this);
		var buttons = getPickerButtons($this, $picker, function() {
			$pickerModal.close();
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

		var $cview = Ti.UI.createView({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
			layout: 'vertical',
			bottom: 0,
			transform: Ti.UI.create2DMatrix().translate(0, 300)
		});
		$cview.add($toolbar);
		$cview.add($picker);

		var $pickerModal = Ti.UI.createWindow({
			backgroundColor: '#4000'
		});
		$pickerModal.add($cview);
		$pickerModal.open();
		$cview.animate({
			transform: Ti.UI.create2DMatrix()
		});
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this) {
		var $picker = createTiUIPicker($this);
		var buttons = getPickerButtons($this, $picker, function() {
			$popover.hide();
		});

		var $cwindow = Ti.UI.createWindow({
			leftNavButton: buttons.cancel,
			rightNavButton: buttons.done
		});
		$cwindow.add($picker);
		$cwindow.addEventListener('close', function() {
			if ($picker.canceled != true) {
				onValueSelected($this, $picker);
			}
		});

		var $navigator = Ti.UI.iOS.createNavigationWindow({
			window: $cwindow,
			tintColor: $this.tintColor
		});
		var $popover = Ti.UI.iPad.createPopover({
			width: 320,
			height: 216 + 40,
			contentView: $navigator
		});
		$popover.show({ view: $this });
	}
};

function dataPickerInterface(opt) {
	var self = {};

	self.values = _.map(opt.values, function(v, index) {
		var val = null;
		if (_.isObject(v)) {
			val = _.extend({}, v, { index: index });
			if (_.isEqual(opt.current, val.value)) {
				val.selected = true;
			}
		} else {
			val = {
				title: v.toString(),
				value: v,
				index: index,
			};
			if (opt.current == v) {
				val.selected = true;
			}
		}
		return val;
	});

	var row = _.findWhere(self.values, { selected: true });
	if (row != null) {
		self.index = row.index;
		self.title = row.title;
	}

	return self;
};

module.exports = function(args) {
	_.defaults(args, {

		/**
		 * @property {String} [dateFormat='D MMMM YYYY']
		 */
		dateFormat: 'D MMMM YYYY',

		/**
		 * @property {Array} [values=[]]
		 * An array containing the values.
		 * You can specify an entry like `{ value: '1', title: 'One' }` to define different title/values.
		 * Alternatively, just delcare an entry with a primitive value.
		 */
		values: [],

		/**
		 * @property {Object} [theValue]
		 * Value of the picker
		 */
		theValue: null,

		/**
		 * @property {String} [type="plain"]
		 * Type of the picker. Could be `plain`, `date`.
		 */
		type: 'plain'

	});

	// Create a unique interface
	if (args.type === 'plain') {
		args.interface = dataPickerInterface({
			values: args.values,
			current: args.theValue
		});
		args.values = null; // free memory
		args.selectedIndex = args.interface.index;
	} else if (args.type === 'date') {
		args.theValue = args.theValue || new Date();
	}

	// Start UI

	var $this = null;

	if (OS_IOS) {

		// in iOS case, $this is a Label
		_.defaults(args, {
			height: 48,
			width: Ti.UI.FILL
		});

		$this = Ti.UI.createLabel(args);

		$this.addEventListener('click', function(){
			UIPickers[ Ti.Platform.osname ]($this);
		});

	} else if (OS_ANDROID) {

		if (args.type === 'plain') {

			// Android Ti.UI.Picker just work
			$this = createTiUIPicker(args);

		} else if (args.type === 'date') {

			// While Ti.UI.Picker Date is only modal
			$this = Ti.UI.createLabel(args);

			$this.addEventListener('click', function(){
				Ti.UI.createPicker({
					type: Ti.UI.PICKER_TYPE_DATE
				}).showDatePickerDialog({
					value: $this.theValue,
					callback: function(e) {
						if (e.value != null && e.cancel === false) {
							$this.theValue = e.value;
							$this.text = Moment($this.theValue).format($this.dateFormat);
						}
					}
				});
			});

		}
	}

	/**
	 * @method getValue
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		return $this.theValue;
	};


	/**
	 * @method  setValues
	 * Set the values
	 */
	$this.setValue = function(value) {
		$this.theValue = value;

		if ($this.type === 'date') {
			$this.theValue = value;
			$this.text = Moment($this.theValue).format($this.dateFormat);

		} else if ($this.type === 'plain') {
			var row = _.findWhere($this.interface.values, { value: value });
			if (row != null) {
				$this.selectedIndex = row.index;
				if (OS_IOS) {
					$this.text = row.title;
				} else if (OS_ANDROID) {
					$this.setSelectedRow(0, $this.selectedIndex || 0, false);
				}
			}
		}
	};

	// Update the UI

	if ($this.type === 'plain') {
		$this.text = $this.interface.title;
	} else if ($this.type === 'date') {
		$this.text = Moment($this.theValue).format($this.dateFormat);
	}

	return $this;
};
