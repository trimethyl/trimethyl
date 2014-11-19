/**
 * @class  	UIFactory.Select
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Moment = require('T/ext/moment');

function parseValues(values, current) {
	return _.map(values, function(v) {
		if (_.isObject(v) && v.value !== void(0)) {
			var _v = _.clone(v);
			if (_.isEqual(current, _v.value)) _v.selected = true;
		} else {
			var _v = { title: v.toString(), value: v };
			if (current === v) _v.selected = true;
		}
		return _v;
	});
}

function createTiUIPicker(proxyArgs) {
	var $picker = null;

	if (proxyArgs.type === 'date') {

		$picker = Ti.UI.createPicker(_.extend({}, _.pick(proxyArgs, 'theValue', 'minDate', 'maxDate'), {
			value: proxyArgs.theValue,
			width: Ti.UI.FILL,
			type: Ti.UI.PICKER_TYPE_DATE
		}));
		$picker.addEventListener('change', function(e) {
			$picker.theValue = e.value;
		});

	} else if (proxyArgs.type === 'plain') {

		var pickerArgs = {};
		if (OS_IOS) {
			pickerArgs.width = Ti.UI.FILL;
		} else if (OS_ANDROID) {
			pickerArgs = _.extend({}, proxyArgs, {
				type: Ti.UI.PICKER_TYPE_PLAIN,
				value: proxyArgs.theValue
			});
		}

		$picker = Ti.UI.createPicker(pickerArgs);
		$picker.add(Ti.UI.createPickerRow({ title: '', value: null }));
		$picker.add(_.map(proxyArgs.values, function(o) {
			return Ti.UI.createPickerRow(o);
		}));

		if (proxyArgs.selectedIndexValue != null) {
			$picker.setSelectedRow(0, proxyArgs.selectedIndexValue || 0, false);
		}

		$picker.addEventListener('change', function(e) {
			$picker.selectedIndexValue = e.rowIndex;
			$picker.theRow = e.row;
			$picker.theValue = e.row.value;
		});
	}

	return $picker;
}

function getPickerButtons($this, $picker, closeCallback) {
	var $doneBtn = Ti.UI.createButton({
		title: L('Done'),
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	$doneBtn.addEventListener('click', function() {
		$this.theValue = $picker.theValue;
		$this.selectedIndexValue = $picker.selectedIndexValue;
		if ($this.type === 'date') {
			$this.text = Moment($this.theValue).format($this.dateFormat);
		} else if ($this.type === 'plain') {
			$this.text = $picker.theRow.title;
		}

		closeCallback();
	});

	var $cancelBtn = Ti.UI.createButton({
		systemButton: Ti.UI.iPhone.SystemButton.CANCEL
	});
	$cancelBtn.addEventListener('click', closeCallback);

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
		var buttons = getPickerButtons($this, $picker, function() { $popover.close(); });

		var $cwindow = Ti.UI.createWindow({
			leftNavButton: buttons.cancel,
			rightNavButton: buttons.done
		});
		$cwindow.add($picker);

		var $navigator = Ti.UI.iOS.createNavigationWindow({
			window: $cwindow
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
		 * You can specify an entry like `{ value: '1', title: 'One' }`
		 * to define different title/values, or simply `1` for the sames.
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

	if (args.type === 'plain') {
		args.values = parseValues(args.values, args.theValue);
		var parsedSelectedValue = _.findWhere(args.values, { selected: true });
		if (parsedSelectedValue != null) {
			args.selectedIndexValue = _.indexOf(args.values, parsedSelectedValue);
			args.text = parsedSelectedValue.title;
		}
	} else if (args.type === 'date') {
		args.theValue = args.theValue || new Date();
		args.text = Moment(args.theValue).format(args.dateFormat);
	}

	var $this = null;

	if (OS_IOS) {

		$this = Ti.UI.createLabel(args);
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

	return $this;
};
