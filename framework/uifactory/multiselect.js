/**
 * @module  uifactory/select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Dialog = require('T/dialog');

var Data = {};

var PICKER_WIDTH_IPHONE = Alloy.Globals.SCREEN_WIDTH;
var PICKER_HEIGHT_IPHONE = 216;

var PICKER_WIDTH_IPAD = 320;
var PICKER_HEIGHT_IPAD = 216;

function getPickerColumn(rows) {
	var $col = Ti.UI.createPickerColumn();
	rows.forEach(function(value) {
		$col.addRow( Ti.UI.createPickerRow(value) );
	});
	return $col;
}

function fillPickerData($this, $picker) {
	if ($this != null) {
		var pickerColumns = Data[ $this._uid ].values.map(getPickerColumn);
		if (pickerColumns.length > 0) $picker.columns = pickerColumns;

		// Wait for visible custom event, 'cause "On iOS, this method must be called after the picker is rendered."
		$picker.addEventListener('visible', function(e) {
			Data[ $this._uid ].values.forEach(function(rows, columnIndex) {
				$picker.setSelectedRow(columnIndex, Data[ $this._uid ].indexes[columnIndex], false);
			});
		});
	}

	Data[ $this._uid ].eventsIndexes = [];
}

function createTiUIPicker($this, opt) {
	var $picker = null;

	$picker = Ti.UI.createPicker(opt || {});
	fillPickerData($this, $picker);

	$picker.addEventListener('change', function(e) {
		Data[ $this._uid ].eventsIndexes[e.columnIndex] = e.rowIndex;
	});

	return $picker;
}

// Get the two buttons in the toolbar
function UIPickerButtons($this, $picker, callbacks) {
	var $doneBtn = Ti.UI.createButton({ title: L('done', 'Done') });

	$doneBtn.addEventListener('click', function() {

		Data[ $this._uid ].eventsIndexes.forEach(function(rowIndex, columnIndex) {
			if (rowIndex != null && rowIndex > -1) {
				Data[ $this._uid ].indexes[columnIndex] = rowIndex;

				var row  = Data[ $this._uid ].values[columnIndex][rowIndex];
				if (row != null) {
					Data[ $this._uid ].value[columnIndex] = row.value;
					Data[ $this._uid ].titles[columnIndex] = row.title;
				}
			}
		});

		$this.updateUI();
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
		var $dialog = null;

		if (Data[ $this._uid ].values.length === 1) {

			// Implement an OptionDialog

			$dialog = Ti.UI.createOptionDialog({
				selectedIndex: Data[ $this._uid ].indexes[0],
				buttonNames: [ L('done'), L('cancel') ],
				options: Data[ $this._uid ].values[0].map(function(e) {
					return String(e.title);
				})
			});

			$dialog.addEventListener('click', function(e) {
				if (e.cancel === true || (e.button === true && e.index === 1)) {
					$this.fireEvent('cancel');
					return;
				}

				Data[ $this._uid ].indexes[0] = e.source.selectedIndex;

				var row  = Data[ $this._uid ].values[0][e.source.selectedIndex];
				if (row != null) {
					Data[ $this._uid ].value[0] = row.value;
					Data[ $this._uid ].titles[0] = row.title;
				}

				$this.updateUI();
			});

			$dialog.show();

		} else {

			// AlertDialog with AndroidView with TiUIPicker

			var $dialogPickers = [];
			$dialog = Ti.UI.createAlertDialog({
				buttonNames: [ L('done'), L('cancel') ],
				androidView: (function() {
					var $a = Ti.UI.createView({
						height: Ti.UI.SIZE
					});

					var len = Data[ $this._uid ].values.length;
					var $wrap = Ti.UI.createView({
						layout: len <= 3 ? 'horizontal' : 'vertical',
						width: len <= 3 ? '100%' : '80%'
					});

					Data[ $this._uid ].values.forEach(function(column, columnIndex) {
						var $picker = Ti.UI.createPicker({
							height: 60,
							width: len <= 3 ? (Math.floor(100/len)+'%') : '100%',
							top: 15,
							columns: [ getPickerColumn(column) ]
						});
						$picker.setSelectedRow(0, Data[ $this._uid].indexes[columnIndex]);

						$picker.addEventListener('change', function(e) {
							$picker._rowIndex = e.rowIndex;
						});

						$dialogPickers.push($picker);
						$wrap.add($picker);
					});

					$a.add( $wrap );
					return $a;
				})()
			});

			$dialog.addEventListener('click', function(e) {
				if (e.cancel || (e.button === true && e.index === 1)) {
					$this.fireEvent('cancel');
					return;
				}

				$dialogPickers.forEach(function($p, columnIndex) {
					if ($p._rowIndex != null && $p._rowIndex > -1) {
						Data[ $this._uid ].indexes[columnIndex] = $p._rowIndex;

						var row  = Data[ $this._uid ].values[columnIndex][$p._rowIndex];
						if (row != null) {
							Data[ $this._uid ].value[columnIndex] = row.value;
							Data[ $this._uid ].titles[columnIndex] = row.title;
						}
					}
				});

				$this.updateUI();
			});

		}

		$dialog.show();
	}

};


function dataPickerInterface(opt) {
	var self = {};

	self.values = opt.columns.map(function(column, columnIndex) {
		return column.map(function(row, rowIndex) {
			var val = null;
			var current = opt.columnsValues != null ? opt.columnsValues[columnIndex] : null;
			if (_.isObject(row)) {
				val = _.extend({}, row, {
					index: rowIndex,
					selected: (current != null && _.isEqual(current, (_.isObject(row) ? row.value : row) ))
				});
			} else {
				val = {
					title: row.toString(),
					value: row,
					index: rowIndex,
					selected: (current != null && current == row)
				};
			}
			if (_.isEmpty(val.title)) {
				val.title = L('no_value');
			}
			return val;
		});
	});

	self.value = [];
	self.indexes = [];
	self.titles = [];

	_.each(self.values, function(rows, columnIndex) {
		var row = _.findWhere(rows, { selected: true });

		if (row != null) {
			self.value[columnIndex] = row.value;
			self.indexes[columnIndex] = row.index;
			self.titles[columnIndex] = row.title;
		} else {
			self.value[columnIndex] = rows[0].value;
			self.indexes[columnIndex] = 0;
			self.titles[columnIndex] = rows[0].title;
		}
	});

	return self;
}

module.exports = function(args) {
	args = _.defaults(args || {}, {

		/**
		 * @property {Array} [columns=[]]
		 * An array containing arrays of values.
		 * For each entry you can specify an entry like `{ value: '1', title: 'One' }` to define different title/values.
		 * Alternatively, just declare an entry with a primitive value.
		 */
		columns: [],

		/**
		 * @property {Object} [columnsValues=null]
		 * Values of the columns
		 */
		columnsValues: null,

		/**
		 * @property {Array} [values=null]
		 * @deprecated Use columns instead
		 * Shorthand for a single-columns values
		 */
		values: null,

		/**
		 * @property {Object} [value=null]
		 * @deprecated Use columnsValues instead
		 * Shorthand for a single-columns columnsValues
		 */
		value: null

	});

	if (args.values != null) {
		args.columns = [ args.values ];
		args.columnsValues = [ args.value ];
	}

	args._uid = _.uniqueId();

	// Create a unique interface
	Data[ args._uid ] = dataPickerInterface({

		columnsValues: args.columnsValues || [args.value],
		columns: args.columns,

	});

	delete args.columns;
	delete args.columnsValues;
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

		var areNullValues = _.every(Data[ $this._uid ].value, function(e) { return e == null; });
		if (areNullValues && $this.hintText != null) {
			$this.text = $this.hintText;
		} else {
			$this.text = Data[ $this._uid ].titles.join(' ');
		}
	};

	/**
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		var v = Data[ $this._uid ].value;

		if (v != null && v.length === 1) return v[0];

		return v;
	};

	/**
	 * @param {Object} value
	 * Set the current value
	 * Shorthand for setColumnsValues with a single columns picker
	 */
	$this.setValue = function(value) {
		$this.setColumnsValues([ value ]);
	};

	/**
	 * @param {Array} values
	 * Shorthand for setColumns with a single columns picker
	 */
	$this.setValues = function(values) {
		$this.setColumns([ values ]);
	};

	/**
	 * Get the internal data interface
	 */
	$this.getDataInterface = function() {
		return Data[ $this._uid ];
	};

	/**
	 * @param {Array} columns The columns
	 * Set the columns for the picker
	 */
	$this.setColumns = function(columns) {
		_.extend(Data[ $this._uid ], dataPickerInterface({
			columnsValues: $this.columnsValues,
			columns: columns
		}));

		$this.updateUI();
	};

	/**
	 * @param {Array} columnsValues
	 */
	$this.setColumnsValues = function(columnsValues) {
		Data[ $this._uid ].value[0] = columnsValues[0];

		Data[ $this._uid ].values.forEach(function(rows, columnIndex) {

			var row = _.find(rows, function(row) {
				return _.isEqual(row.value, columnsValues[columnIndex]);
			});

			if (row != null) {
				Data[ $this._uid ].value[columnIndex] = row.value;
				Data[ $this._uid ].indexes[columnIndex] = row.index;
				Data[ $this._uid ].titles[columnIndex] = row.title;
			} else {
				Ti.API.warn('UIFactory.Select: can\'t find this value in the list');
				Data[ $this._uid ].value[columnIndex] = null;
				Data[ $this._uid ].indexes[columnIndex] = -1;
				Data[ $this._uid ].titles[columnIndex] = '';
			}

		});

		$this.updateUI();
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
