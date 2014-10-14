/**
 * @class  UIFactory.DatePicker
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 *
 * Show a DatePicker dialog for iOS + Android.
 *
 * ### Arguments
 *
 * #### `callback(value: Date) (Function)`
 *
 * The callback to invoke when user clicks Done.
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
 */

module.exports = function(args) {
	args = args || {};

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
		type: Ti.UI.PICKER_TYPE_DATE,
		minDate: new Date(1990,1,1),
		maxDate: new Date(2020,1,1),
		bottom: 0,
		useSpinner: true,
		height: 216
	}, _.pick(args, 'minDate', 'maxDate', 'value')));

	$this.$picker.addEventListener('change', function(e){
		$this.value = e.value;
	});
	$view.add($this.$picker);

	/*
	Build toolbar
	*/

	var $doneBtn = Ti.UI.createButton({
		title: L('Done'),
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	$doneBtn.addEventListener('click', function() {
		if (args.autoClose === true) $this.close();
		if (_.isFunction(args.callback)) args.callback($this.value);
	});

	var $cancelBtn = Ti.UI.createButton({
		systemButton: Ti.UI.iPhone.SystemButton.CANCEL
	});
	$cancelBtn.addEventListener('click', function(e){
		$this.close();
		if (_.isFunction(args.cancel)) args.cancel();
	});

	$view.add(Ti.UI.iOS.createToolbar({
		items: [
			$cancelBtn,
			Ti.UI.createButton({ systemButton:Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE }),
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
