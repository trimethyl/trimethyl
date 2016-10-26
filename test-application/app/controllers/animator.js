var Animator = T('animator');
var Dialog = T('dialog');

Dialog.option('Select an animation', [
	{
		title: 'fallDownForGravity',
		callback: function() {

			Animator.fallDownForGravity({
				view: block
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

$.args.nav.openWindow( $.win );