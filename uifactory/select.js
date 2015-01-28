/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('T/ext/moment');

function createTiUIPicker($this) {
	var $picker = null;


	if ($this.typeString === 'plain') {
		if (OS_IOS) {
			$picker = Ti.UI.createPicker({
				width: Ti.UI.FILL,
			});
		} else if (OS_ANDROID) {
			$picker = Ti.UI.createPicker($this);
		}

		// Cycle over values and row
		$picker.add(_.map($this.interfaceValues, function(o) {
			return Ti.UI.createPickerRow(o);
		}));

		// Set current value
		$picker.setSelectedRow(0, $this.interfaceIndex || 0, false);

		$picker.addEventListener('change', function(e) {
			$picker.cdata = e;
			if (OS_ANDROID) {
				// This is the root of all evils - is $picker, $picker (not $this, $picker)
				onValueSelected($picker, $picker);
			}
		});

	} else if ($this.typeString === 'date') {
		if (OS_IOS) {
			$picker = Ti.UI.createPicker({
				value: $this.interfaceValue,
				minDate: $this.minDate,
				maxDate: $this.maxDate,
				width: Ti.UI.FILL,
				type: Ti.UI.PICKER_TYPE_DATE,
			});
		} else if (OS_ANDROID) {
			// no case
		}

		$picker.addEventListener('change', function(e) {
			$picker.cdata = e;
		});

	}

	return $picker;
}

// When a value change
function onValueSelected($this, $picker) {
	var e = $picker.cdata;

	if ($this.typeString === 'plain') {
		$this.interfaceValue = e.row.value;
		$this.interfaceIndex = e.row.index;
		$this.interfaceTitle = e.row.title;
	} else if ($this.typeString === 'date') {
		$this.interfaceValue = e.value;
	}

	if (_.isFunction($this.updateUI)) {
		$this.updateUI();
	}
}

// Get the two buttons in the toolbar
function UIPickerButtons($this, $picker, closeCallback) {
	var $doneBtn = Ti.UI.createButton({
		title: L('done', 'Done')
	});

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
		var buttons = UIPickerButtons($this, $picker, function() {
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
			backgroundColor: '#4000'
		});
		$pickerModal.add($containerView);
		$pickerModal.open();

		$containerView.animate({
			transform: Ti.UI.create2DMatrix()
		});
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this) {
		var $picker = createTiUIPicker($this);
		var buttons = UIPickerButtons($this, $picker, function() {
			$popover.hide();
		});

		var $containerWindow = Ti.UI.createWindow({
			leftNavButton: buttons.cancel,
			rightNavButton: buttons.done
		});
		$containerWindow.add($picker);
		$containerWindow.addEventListener('close', function() {
			if ($picker.canceled != true) {
				onValueSelected($this, $picker);
			}
		});

		var $navigator = Ti.UI.iOS.createNavigationWindow({
			window: $containerWindow,
			tintColor: $this.tintColor
		});

		var $popover = Ti.UI.iPad.createPopover({
			width: 320,
			height: 216 + 40,
			contentView: $navigator
		});

		$popover.show({
			view: $this
		});
	},

	android: function($this) {
		Ti.UI.createPicker(
			_.extend({}, _.pick($this, 'minDate', 'maxDate'), {
				typeString: Ti.UI.PICKER_TYPE_DATE,
			})
		).showDatePickerDialog({
			value: $this.interfaceValue,
			callback: function(e) {
				if (e.value == null || e.cancel !== false) return;

				$this.interfaceValue = e.value;
				$this.updateUI();
			}
		});
	}

};

function dataPickerInterface(opt) {
	var self = {};

	if (opt.type === 'plain') {

		self.interfaceValues = _.map(opt.values, function(v, index) {
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

		var row = _.findWhere(self.interfaceValues, { selected: true });
		if (row != null) {
			self.interfaceValue = row.value;
			self.interfaceIndex = row.index;
			self.interfaceTitle = row.title;
		}

	} else if (opt.type === 'date') {
		self.interfaceValue = opt.current || new Date();
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
		 * @property {Object} [value]
		 * Value of the picker
		 */
		value: null,

		/**
		 * @property {String} [type="plain"]
		 * Type of the picker. Could be `plain`, `date`.
		 */
		type: 'plain'

	});

	// Create a unique interface
	_.extend(args, dataPickerInterface({
		values: args.values,
		current: args.value || args.theValue, // theValue is deprecated
		type: args.type
	}));

	delete args.theValue;
	delete args.value;
	delete args.values;

	args.typeString = args.type;
	delete args.type;

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

		if (args.typeString === 'plain') {

			// Android Ti.UI.Picker just work
			$this = createTiUIPicker(args);

		} else if (args.typeString === 'date') {

			// While Ti.UI.Picker Date is only modal
			$this = Ti.UI.createLabel(args);

			$this.addEventListener('click', function(){
				UIPickers.android($this);
			});

		}
	}

	$this.updateUI = function() {
		if ($this.typeString === 'plain') {
			if (OS_IOS) {
				$this.text = $this.interfaceTitle;
			} else {
				this.setSelectedRow(0, $this.interfaceIndex || 0, false);
			}
		} else if ($this.typeString === 'date') {
			$this.text = Moment($this.interfaceValue).format($this.dateFormat);
		}
	};

	/**
	 * @method getValue
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		return $this.interfaceValue;
	};


	/**
	 * @method  setValues
	 * Set the values
	 */
	$this.setValue = function(value) {
		$this.interfaceValue = value;

		if ($this.typeString === 'plain') {
			var row = _.findWhere($this.interfaceValues, { value: value });
			if (row != null) {
				$this.interfaceIndex = row.index;
				$this.interfaceTitle = row.title;
			}
		}

		$this.updateUI();
	};

	// Update the UI
	$this.updateUI();

	return $this;
};
