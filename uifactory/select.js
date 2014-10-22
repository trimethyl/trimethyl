/**
 * @class  UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * ### Arguments
 *
 * #### `values`. Type: `Array`
 *
 * An array containing the values.
 *
 * You can specify an entry like `{ value: '1', title: 'One' }` to define different title/values,
 * or simply `1` for the sames.
 *
 * #### `theValue`. Type: `Object`
 *
 * The selected value
 *
 * ### Obtain the value
 *
 * Use the `getValue` function.
 *
 */

var Moment = require('T/ext/moment');

function createTiUIPicker(args) {
	var pickerArgs = {};
	var pickerType = (function(){
		if (args.type === 'date') return Ti.UI.PICKER_TYPE_DATE;
		return Ti.UI.PICKER_TYPE_PLAIN;
	})();

	if (OS_IOS) {
		pickerArgs = _.extend(_.pick(args, 'minDate', 'maxDate'), {
			height: 216,
			bottom: 0,
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
				text: Moment(pickerArgs.theValue).format('D MMMM YYYY')
			}));

			$picker.addEventListener('click', function(){
				Ti.UI.createPicker({ type: Ti.UI.PICKER_TYPE_DATE }).showDatePickerDialog({
					value: $picker.theValue,
					callback: function(e) {
						if (e.value != null && e.cancel === false) {
							$picker.theValue = e.value;
							$picker.text = Moment($picker.theValue).format('D MMMM YYYY');
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

module.exports = function(args) {
	args = args || {};
	var $this = null;

	if (OS_IOS) {

		$this = Ti.UI.createLabel(args);

		// Function that open the Picker modal window
		$this.showPicker = function() {
			var $pickerModal = Ti.UI.createWindow({ backgroundColor: 'transparent' });
			var $pickerModalView = Ti.UI.createView({
				height: 216 + 50,
				width: Ti.UI.FILL,
				bottom: 0,
				transform: Ti.UI.create2DMatrix().translate(0, 216+50)
			});
			var $picker = createTiUIPicker($this);

			var $doneBtn = Ti.UI.createButton({ title: L('Done'), style: Ti.UI.iPhone.SystemButtonStyle.DONE });
			$doneBtn.addEventListener('click', function() {
				if (args.type === 'date') {
					$this.text = Moment($picker.theValue).format('D MMMM YYYY');
				} else {
					$this.text = $picker.theRow.title;
				}
				$this.theValue = $picker.theValue;
				$pickerModal.close();
			});

			var $cancelBtn = Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.CANCEL });
			$cancelBtn.addEventListener('click', function() {
				$pickerModal.close();
			});

			$pickerModalView.add(Ti.UI.iOS.createToolbar({
				items: [ $cancelBtn, Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }), $doneBtn ],
				bottom: 216,
				borderTop: true,
				borderBottom: false
			}));

			$pickerModalView.add($picker);
			$pickerModal.add($pickerModalView);

			$pickerModal.open();
			$pickerModalView.animate({ transform: Ti.UI.create2DMatrix() });
		};

		// Trigger modal on click
		$this.addEventListener('click', $this.showPicker);

	} else if (OS_ANDROID) {

		$this = createTiUIPicker(args);

	}

	$this.getValue = function() {
		return $this.theValue;
	};

	return $this;
};
