var args = $.args;

var $page = T('weballoy').createView({
	top: 0,
	bottom: 0,
	name: 'weballoy-test'
});

$.win.add($page);

$.args.nav.openWindow( $.win );
