/**
 * @class  UIFactory.Picker
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * Show a Picker dialog for iOS + Android.
 *
 * ### Arguments
 *
 * #### `callback(value: Mixed) (Function)`
 *
 * The callback to invoke when user clicks Done.
 *
 * Use `this` to access to other properties like `this.selectedRow`
 *
 * #### `cancel() (Function)`
 *
 * The callback to invoke when user clicks Cancel.
 *
 * #### `autoClose (Boolean)`
 *
 * If `true`, close the window when users clicks Done.
 * Otherwise, use `.close()`. in your callback.
 *
 * #### `values (Array)`
 *
 * An array containing the values.
 *
 * You can specify an entry like `{ value: '1', title: 'One' }` to define different title/values,
 * or simply `1` for the sames.
 *
 */

 module.exports = function(args) {
 	args = args || {};
 	var isDatePicker = (args.type === Ti.UI.PICKER_TYPE_DATE);

 	var $this = Ti.UI.createWindow({
 		backgroundColor: 'transparent'
 	});

 	var $view = Ti.UI.createView({
 		height: 216+50,
 		bottom: 0,
 		transform: Ti.UI.create2DMatrix().translate(0, 216+50)
 	});

	/*
	Build picker
	*/

	$this.$picker = Ti.UI.createPicker(_.extend({
		bottom: 0,
		useSpinner: true,
		height: 216
	}, _.omit(args, 'values', 'value')));

	// Function to obtain an absolute value
	$this.getValue = function() {
		return $this.value;
	};


	if (isDatePicker === true) {
		$this.$picker.addEventListener('change', function(e) {
			$this.value = e.value;
		});
		$this.value = $this.$picker.value;
	} else {

		$this.$picker.addEventListener('change', function(e) {
			$this.selectedRow = e.row;
			$this.value = e.row.value;
		});

		if (args.values != null) {

			var selectedRowIndex = 0;
			$this.$picker.add(_.map(args.values, function(v, index) {
				var $pickerRow = null;
				if (_.isObject(v) && v.value !== undefined) {
					$pickerRow = Ti.UI.createPickerRow(v);
					if (args.value == v.value) selectedRowIndex = +index;
				} else {
					$pickerRow = Ti.UI.createPickerRow({ title: v.toString(), value: v });
					if (args.value == v) selectedRowIndex = +index;
				}
				return $pickerRow;
			}));

			$this.$picker.setSelectedRow(0, selectedRowIndex, false);
		}
	}


	$view.add($this.$picker);


	/*
	Build toolbar
	*/

	var $doneBtn = Ti.UI.createButton({
		title: L('Done'),
		color: args.tintColor,
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	$doneBtn.addEventListener('click', function() {
		if (args.autoClose === true) $this.close();
		if (_.isFunction(args.callback)) {
			args.callback.call($this, $this.getValue());
		}
	});

	var $cancelBtn = Ti.UI.createButton({
		color: args.tintColor,
		systemButton: Ti.UI.iPhone.SystemButton.CANCEL
	});
	$cancelBtn.addEventListener('click', function(e){
		$this.close();
		if (_.isFunction(args.cancel)) {
			args.cancel.call($this);
		}
	});

	$view.add(Ti.UI.iOS.createToolbar({
		items: [
		$cancelBtn,
		Ti.UI.createButton({ systemButton: Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }),
		$doneBtn
		],
		bottom: 216,
		borderTop: true,
		borderBottom: false
	}));


	/*
	Override open/close
	*/

	$this.add($view);
	$this.addEventListener('open', function(e){
		$view.animate({
			transform: Ti.UI.create2DMatrix()
		});
	});

	return $this;
};
