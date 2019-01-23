var Animator = require('T/animator');
var Dialog = require('T/dialog');

Dialog.option('Select an animation', [
	{
		title: 'fallDownForGravity',
		callback: function() {

			Animator.fallDownForGravity({
				view: block,
				y: 300,
				potentialEnergy: 100,
				gravity: 9.81
			});

		}
	},
	{
		title: 'Cancel',
		cancel: true
	}
]);

var block = Ti.UI.createView({ 
	width: 40,
	height: 40,
	borderRadius: 20,
	top: 20,
	backgroundColor: 'red'
});
$.win.add(block);