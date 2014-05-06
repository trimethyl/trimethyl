/*

UI module (non-standard require module)
Author: Flavio De Stefano
Company: Caffeina SRL

*/

/*
TabView
- A TabView withouts tabs
*/

exports.createTabView = function(args) {
	var $this = Ti.UI.createView(args);

	$this.setActive = function(i) {
		$this.activeViewIndex = +i;
		_.each($this.children, function($el, k){
			if (i==+k) {
				$el.visible = true;
				if ($el.id) {
					$this.activeViewId = $el.id;
				}
			} else {
				$el.visible = false;
			}
		});
	};

	return $this;
};


/*
ModalWindow
*/

function ModalWindow(args) {
	var self = this;

	self._Window =  Ti.UI.createWindow(args || {});

	var $leftButton = Ti.UI.createButton({ title: L('Cancel') });
	$leftButton.addEventListener('click', function(){
		self.close();
	});
	self._Window.leftNavButton = $leftButton;

	self._Navigator = require('xp.ui').createNavigationWindow({
		window: self._Window
	});
}

ModalWindow.prototype = {
	close: function(){
		this._Navigator.close();
	},
	open: function(){
		this._Navigator.open({
			modal: true
		});
	},
	add: function($win){
		this._Window.add($win);
	}
};

exports.createModalWindow = function(args) {
	return new Modal(args);
};