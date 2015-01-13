/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('T/ext/moment');

function parseValues(values, current) {
	return _.map(values, function(v, index) {
		if (_.isObject(v)) {
			var _v = _.extend({}, v, {
				index: index
			});
			if (_.isEqual(current, _v.value)) _v.selected = true;
		} else {
			var _v = {
				title: v.toString(),
				value: v,
				index: index,
			};
			if (current == v) _v.selected = true;
		}
		return _v;
	});
}

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
		pickerArgs = null;

		$picker.add(Ti.UI.createPickerRow({ title: '', value: null })); // add a null value
		$picker.add(_.map($this.values, function(o) {
			return Ti.UI.createPickerRow(o);
		}));

		if ($this.selectedIndexValue != null) {
			$picker.setSelectedRow(0, $this.selectedIndexValue, false);
		}

		$picker.addEventListener('change', function(e) {
			$picker.selectedIndexValue = e.rowIndex;
			$picker.theRow = e.row;
			$picker.theValue = e.row.value;
		});

	} else if ($this.type === 'date') {

		$picker = Ti.UI.createPicker(_.extend({}, _.pick($this, 'theValue', 'minDate', 'maxDate'), {
			value: $this.theValue,
			width: Ti.UI.FILL,
			type: Ti.UI.PICKER_TYPE_DATE
		}));
		$picker.addEventListener('change', function(e) {
			$picker.theValue = e.value;
		});

	}

	return $picker;
}

function onValueSelected($this, $picker) {
	$this.theValue = $picker.theValue;
	$this.selectedIndexValue = $picker.selectedIndexValue;
	if ($this.type === 'date') {
		$this.text = Moment($this.theValue).format($this.dateFormat);
	} else if ($this.type === 'plain') {
		$this.text = $picker.theRow.title;
	}
}

function getPickerButtons($this, $picker, closeCallback) {
	var $doneBtn = Ti.UI.createButton({ title: L('done'), });

	$doneBtn.addEventListener('click', function() {
		onValueSelected($this, $picker);
		closeCallback();
	});

	var $cancelBtn = Ti.UI.createButton({ title: L('cancel'), });
	$cancelBtn.addEventListener('click', function() {
		$picker.canceled = true;
		closeCallback();
	});

	return {
		done: $doneBtn,
		cancel: $cancelBtn
	};
}

var pickers = {

	// Show the picker in a Window that slide in from the bottom
	iphone: function($this) {
		var $picker = createTiUIPicker($this);
		var buttons = getPickerButtons($this, $picker, function() { $pickerModal.close(); });
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
		$cview.animate({ transform: Ti.UI.create2DMatrix() });
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this) {
		var $picker = createTiUIPicker($this);
		var buttons = getPickerButtons($this, $picker, function() { $popover.hide(); });

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
		 * @property {Object} theValue Value of the picker
		 */
		theValue: null,

		/**
		 * @property {String} type Type of the picker. Could be `plain`, `date`.
		 */
		type: 'plain'

	});

	var $this = null;

	if (OS_IOS) {

		$this = Ti.UI.createLabel(_.extend({
			height: 48,
			width: Ti.UI.FILL
		}, args));

		$this.addEventListener('click', function(){
			pickers[Ti.Platform.osname]($this);
		});

	} else if (OS_ANDROID) {

		if (args.type === 'plain') {

			$this = createTiUIPicker(args);

		} else if (args.type === 'date') {

			$this = Ti.UI.createLabel(args);
			$this.addEventListener('click', function(){
				Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
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
	 * @method setValues
	 * @property {Array} values
	 */
	$this.setValues = function(values) {
		if (args.type === 'plain') {
			$this.values = parseValues(values, $this.theValue);
			var pSelValue = _.findWhere($this.values, { selected: true });
			if (pSelValue != null) {
				$this.selectedIndexValue = pSelValue.index + 1; // for the null value added
				$this.text = pSelValue.title;
			} else {
				$this.selectedIndexValue = null;
				$this.text = $this.hintText || '';
			}
		}
	};

	if (args.type === 'plain') {
		$this.setValues(args.values);
	} else if (args.type === 'date') {
		$this.theValue = args.theValue || new Date();
		$this.text = Moment($this.theValue).format($this.dateFormat);
	}

	return $this;
};
