/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('alloy/moment');
var Util = require('T/util');

var Data = {};

function fillPickerData($this, $picker) {
	if (OS_ANDROID) {
		_.each($picker.columns, function(col) {
			for (var i = col.rowCount; i >= 0; i--) {
				col.removeRow( col.rows[i] );
			}
		});
	}

	if ($this != null) {
		var pickerColumns = Data[ $this._uid ].interfaceValues.map(function(rows, columnIndex) {
			var $col = Ti.UI.createPickerColumn();
			rows.forEach(function(value) {
				$col.addRow( Ti.UI.createPickerRow(value) );
			});
			return $col;
		});
		$picker.columns = pickerColumns;
		Data[ $this._uid ].interfaceValues.forEach(function(rows, columnIndex) {
			$picker.setSelectedRow(columnIndex, Data[ $this._uid ].interfaceIndex[columnIndex] || 0, false);
		});
	}

	Data[ $this._uid ].eventsOnChange = [];
}

function onValueSelected($this, $picker) {
	if ($this.typeString === 'plain') {

		Data[ $this._uid ].eventsOnChange.forEach(function(e, columnIndex) {
			Ti.API.error('------------', e, columnIndex);
			if (e != null) {
				Data[ $this._uid ].interfaceValue[columnIndex] = e.value;
				Data[ $this._uid ].interfaceIndex[columnIndex] = e.index;
				Data[ $this._uid ].interfaceTitle[columnIndex] = e.value ? e.title : null;
			}
		});

	} else if ($this.typeString === 'date') {
		$this.interfaceValue = $picker.value;
	}

	if (OS_IOS) {
		if (_.isFunction($this.updateUI)) $this.updateUI();
	}
}

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

		fillPickerData($this, $picker);

		$picker.addEventListener('change', function(e) {
			Data[ $this._uid ].eventsOnChange[e.columnIndex] = e.row;

			if (OS_ANDROID) {
				// This has been the root of all evils - is $picker, $picker (not $this, $picker)
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
			$picker.eventsOnChange = e;
		});

	}

	return $picker;
}

// Get the two buttons in the toolbar
function UIPickerButtons($this, $picker, callbacks) {
	var $doneBtn = Ti.UI.createButton({ title: L('done', 'Done') });
	$doneBtn.addEventListener('click', function() {
		onValueSelected($this, $picker);
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
		var $picker = createTiUIPicker($this);
		var buttons = UIPickerButtons($this, $picker, {
			cancel: function() {
				$this.fireEvent('cancelled');
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
		$pickerModal.open();

		$containerView.animate({
			transform: Ti.UI.create2DMatrix()
		});
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this) {
		var $picker = createTiUIPicker($this);
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

		$containerWindow.addEventListener('close', function(e) {
			if (!has_value) {
				$this.fireEvent('cancelled');
			}
		});

		var $navigator = Ti.UI.iOS.createNavigationWindow({
			window: $containerWindow,
			width: 320,
			height: 216 + 40, // 216 is the default iOS iPad picker height
		});

		var $popover = Ti.UI.iPad.createPopover({
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


function dataPickerInterface(type, opt) {
	var self = {};

	if (type === 'plain') {

		self.interfaceValues = opt.columns.map(function(column, columnIndex) {
			return column.map(function(row, rowIndex) {
				var val = null;
				var current = opt.columnsValues != null ? opt.columnsValues[columnIndex] : null;
				if (_.isObject(row)) {
					val = _.extend({}, row, {
						index: rowIndex,
						selected: (current != null && _.isEqual(current, val.value))
					});
				} else {
					val = {
						title: row.toString(),
						value: row,
						index: rowIndex,
						selected: (current != null && current == row)
					};
				}
				return val;
			});
		});

		Ti.API.error('JOHHHHN', self.interfaceValues);

		self.interfaceValue = [];
		self.interfaceIndex = [];
		self.interfaceTitle = [];

		_.each(self.interfaceValues, function(rows, columnIndex) {
			var row = _.findWhere(rows, { selected: true });

			if (row != null) {
				self.interfaceValue[columnIndex] = row.value;
				self.interfaceIndex[columnIndex] = row.index;
				self.interfaceTitle[columnIndex] = row.title;
			} else {
				self.interfaceValue[columnIndex] = null;
				self.interfaceIndex[columnIndex] = null;
				self.interfaceTitle[columnIndex] = null;
			}
		});

	} else if (type === 'date') {
		//self.dateValue = opt.current || new Date();
	}

	return self;
}

module.exports = function(args) {
	args = _.defaults(args || {}, {

		/**
		 * @property {String} [dateFormat='D MMMM YYYY']
		 */
		dateFormat: 'D MMMM YYYY',

		/**
		 * @property {Array} [columns=[]]
		 * An array containing arrays of values.
		 * For each entry you can specify an entry like `{ value: '1', title: 'One' }` to define different title/values.
		 * Alternatively, just declare an entry with a primitive value.
		 */
		columns: [],

		/**
		 * @property {Object} [value]
		 * Values of the columns
		 */
		columnsValues: null,

		/**
		 * @property {Array} [values=[]]
		 * Shorthand for a single-columns values
		 */
		values: null,

		/**
		 * @property {Object} [value]
		 * Shorthand for a single-columns columnsValues
		 */
		value: null,

		/**
		 * @property {String} [type="plain"]
		 * Type of the picker. Could be `plain`, `date`.
		 */
		type: 'plain',

		current: null

	});

	if (args.values != null) {
		args.columns = [ args.values ];
		args.columnsValues = [ args.value ];
	}

	args._uid = _.uniqueId();

	// Create a unique interface
	Data[ args._uid ] = dataPickerInterface(args.type, {
		columnsValues: args.columnsValues,
		columns: args.columns
	});

	delete args.columns;
	delete args.columnsValues;
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
		$this.fireEvent('change', {
			value: $this.getValue(),
			source: $this
		});

		if ($this.typeString === 'plain') {

			Ti.API.error('intftext', Data[ $this._uid ].interfaceTitle);

			if (OS_IOS) {
				$this.text = Data[ $this._uid ].interfaceTitle.join(' ') || $this.hintText || '';
			} else {
				Data[ $this._uid ].interfaceIndex.forEach(function(rowIndex, columnIndex) {
					this.setSelectedRow(columnIndex, rowIndex, false);
				});
			}

		} else if ($this.typeString === 'date') {
			// $this.text = $this.interfaceValue ? Moment($this.interfaceValue).format($this.dateFormat) : ($this.hintText || '');
		}
	};

	/**
	 * @method getValue
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		var interfaceValues = Data[ $this._uid ].interfaceValues;
		if (interfaceValues.length === 1) return interfaceValues[0];
		return interfaceValues;
	};

	/**
	 * @method  setValue
	 * Set the current value
	 */
	$this.setValue = function(values) {
		Data[ $this._uid ].interfaceValue = value;

		if ($this.typeString === 'plain') {
			Data[ $this._uid ].interfaceValues.forEach(function(rows, columnIndex) {
				var row = _.findWhere(rows, { value: values[columnIndex] });
				if (row != null) {
					Data[ $this._uid ].interfaceIndex[columnIndex] = row.index;
					Data[ $this._uid ].interfaceTitle[columnIndex] = row.title;
				}
			});
		}

		$this.updateUI();
	};

	/**
	 * @method setValues
	 * @param {Array} values The values
	 * Set the values for the picker
	 */
	$this.setValues = function(values) {
		$this.setColumns([ values ]);
	};

	/**
	 * @method setColumns
	 * @param {Array} columns The columns
	 * Set the columns for the picker
	 */
	$this.setColumns = function(columns) {
		_.extend(Data[ args._uid ], dataPickerInterface($this.typeString, {
			columnsValues: $this.columnsValues,
			columns: columns
		}));

		if (OS_ANDROID) {
			fillPickerData($this, $this);
		}

		$this.updateUI();
	};

	/**
	 * @method open
	 * Open the picker
	 */
	$this.open = function() {
		UIPickers[ Ti.Platform.osname ]($this);
	};

	// Update the UI
	$this.updateUI();

	return $this;
};
