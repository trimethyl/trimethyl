/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('T/ext/moment');

function createTiUIPicker(args) {
	var pickerArgs = {};
	var pickerType = Ti.UI.PICKER_TYPE_PLAIN;
	if (args.type === 'date') pickerType = Ti.UI.PICKER_TYPE_DATE;

	if (OS_IOS) {
		pickerArgs = _.extend(_.pick(args, 'minDate', 'maxDate'), {
			width: Ti.UI.FILL,
			type: pickerType
		});
	} else if (OS_ANDROID) {
		pickerArgs = _.extend(_.omit(args, 'values', 'type'));
	}

	var $picker = null;

	if (args.type === 'date') {

		pickerArgs.theValue = args.theValue || new Date();
		pickerArgs.value = pickerArgs.theValue;

		if (OS_IOS) {

			$picker = Ti.UI.createPicker(pickerArgs);
			$picker.addEventListener('change', function(e) {
				$picker.theValue = e.value;
			});

		} else if (OS_ANDROID) {

			$picker = Ti.UI.createLabel(_.extend(pickerArgs, {
				text: Moment(pickerArgs.theValue).format(args.dateFormat)
			}));

			$picker.addEventListener('click', function(){
				Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
					value: $picker.theValue,
					callback: function(e) {
						if (e.value != null && e.cancel === false) {
							$picker.theValue = e.value;
							$picker.text = Moment($picker.theValue).format(args.dateFormat);
						}
					}
				});
			});

		}

	} else {

		$picker = Ti.UI.createPicker(pickerArgs);
		var selectedRowIndex = 0;

		$picker.add(_.map(args.values, function(v, index) {
			var $pickerRow = null;
			if (_.isObject(v) && v.value !== undefined) {
				$pickerRow = Ti.UI.createPickerRow(v);
				if (args.theValue === v.value) selectedRowIndex = +index;
			} else {
				$pickerRow = Ti.UI.createPickerRow({ title: v.toString(), value: v });
				if (args.theValue === v) selectedRowIndex = +index;
			}
			return $pickerRow;
		}));

		$picker.setSelectedRow(0, selectedRowIndex, false);
		$picker.addEventListener('change', function(e) {
			$picker.theRow = e.row;
			$picker.theValue = e.row.value;
		});

	}

	return $picker;
}

var pickers = {

	// Show the picker in a Window that slide in from the bottom
	iphone: function($this, args) {
		var $picker = createTiUIPicker($this);

		var $pickerModalView = Ti.UI.createView({
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
			layout: 'vertical',
			bottom: 0,
			transform: Ti.UI.create2DMatrix().translate(0, 300)
		});

		var $doneBtn = Ti.UI.createButton({ title: L('Done'), style: Ti.UI.iPhone.SystemButtonStyle.DONE });
		$doneBtn.addEventListener('click', function() {
			if (args.type === 'date') {
				$this.text = Moment($picker.theValue).format(args.dateFormat);
			} else {
				$this.text = $picker.theRow.title;
			}
			$this.theValue = $picker.theValue;
			$pickerModal.close();
		});

		var $cancelBtn = Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.CANCEL });
		$cancelBtn.addEventListener('click', function() { $pickerModal.close(); });

		$pickerModalView.add(Ti.UI.iOS.createToolbar({
			items: [ $cancelBtn, Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }), $doneBtn ],
			borderTop: true,
			borderBottom: false
		}));
		$pickerModalView.add($picker);

		var $pickerModal = Ti.UI.createWindow({ backgroundColor: 'transparent' });
		$pickerModal.add($pickerModalView);

		$pickerModal.open();
		$pickerModalView.animate({ transform: Ti.UI.create2DMatrix() });
	},

	// Show the picker in a Popover Window attached to the Label
	ipad: function($this, args) {
		var $picker = createTiUIPicker($this);

		var $doneBtn = Ti.UI.createButton({ title: L('Done'), style: Ti.UI.iPhone.SystemButtonStyle.DONE });
		$doneBtn.addEventListener('click', function() {
			if (args.type === 'date') {
				$this.text = Moment($picker.theValue).format(args.dateFormat);
			} else {
				$this.text = $picker.theRow.title;
			}
			$this.theValue = $picker.theValue;
			$popover.hide();
		});

		var $cancelBtn = Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.CANCEL });
		$cancelBtn.addEventListener('click', function() { $popover.hide(); });

		var $popoverContentWindow = Ti.UI.createWindow({
			leftNavButton: $cancelBtn,
			rightNavButton: $doneBtn
		});
		$popoverContentWindow.add($picker);

		var $popoverNavigationWindow = Ti.UI.iOS.createNavigationWindow({
			window: $popoverContentWindow
		});

		var $popover = Ti.UI.iPad.createPopover({
			width: 320,
			height: 216 + 40,
			contentView: $popoverNavigationWindow
		});

		$popover.show({ view: $this });
	}
};

module.exports = function(args) {
	args = _.extend({

		/**
		 * @property {String} [dateFormat='D MMMM YYYY']
		 */
		dateFormat: 'D MMMM YYYY',

		/**
		 * @property {Array} [values=[]]
		 * An array containing the values.
		 * You can specify an entry like `{ value: '1', title: 'One' }`
		 * to define different title/values, or simply `1` for the sames.
		 */
		values: [],

		/**
		 * @property {Object} theValue Value of the picker
		*/
		theValue: null

	}, args);
	var $this = null;

	if (OS_IOS) {
		$this = Ti.UI.createLabel(args);
		$this.addEventListener('click', function(){
			pickers[Ti.Platform.osname]($this, args);
		});
	} else if (OS_ANDROID) {
		$this = createTiUIPicker(args);
	}

	/**
	 * @method getValue
	 * Get the value
	 * @return {Object}
	 */
	$this.getValue = function() {
		return $this.theValue;
	};

	return $this;
};
