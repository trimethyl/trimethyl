/*

NOT DOCUMENTED BECAUSE I HAVE TO MOVE TO A NEW WIDGET
com.caffeinalab.titanium.toast

Stay tuned!

*/


var config = _.extend({
	timeout: 2000,
	backgroundColor: '#B000',
	color: '#fff',
	elasticity: 0.5,
	pushForce: 30
}, Alloy.CFG.toast);
exports.config = config;


function showIOS7(msg, args) {
	var HEIGHT = 64;

	var $cont = Ti.UI.createWindow({
		height: 10 + HEIGHT*2,
		top: -10-HEIGHT,
		fullscreen: true,
		backgroundColor: 'transparent'
	});

	var $ui = Ti.UI.createView({
		top: 0,
		backgroundColor: args.background,
		height: HEIGHT+1,
		touchEnabled: false
	});

	$ui.add(Ti.UI.createLabel({
		text: msg,
		touchEnabled: false,
		left: 15,
		right: 15,
		height: HEIGHT-5,
		color: args.color,
		textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
		font: {
			fontWeight: 'Bold',
			fontSize: 20
		}
	}));

	$cont.add($ui);

	var animator = Ti.UI.iOS.createAnimator({ referenceView: $cont });

	var collision = Ti.UI.iOS.createCollisionBehavior();
	collision.addItem($ui);
	animator.addBehavior(collision);

	var dy = Ti.UI.iOS.createDynamicItemBehavior({ elasticity: config.elasticity });
	dy.addItem($ui);
	animator.addBehavior(dy);

	var pusher = Ti.UI.iOS.createPushBehavior({ pushDirection: { x: 0, y: config.pushForce } });
	pusher.addItem($ui);
	animator.addBehavior(pusher);

	$cont.addEventListener('open', function(e){ animator.startAnimator(); });
	$cont.addEventListener('touchstart', function(e){
		clearTimeout(timeout);
		$cont.close();
	});

	var timeout = setTimeout(function(){
		dy.elasticity = 0;
		pusher.pushDirection = { x: 0, y: -config.pushForce };

		setTimeout(function(){
			if ($cont) $cont.close();
		}, 500);

	}, args.timeout);

	$cont.open();

	return $cont;
}

function showIOS(msg, args) {
	return alert(msg);
}

function showAndroid(msg, args) {
	var toast = Ti.UI.createNotification({
		message: msg,
		duration: args.timeout
	});
	toast.show();
	return toast;
}

function show(msg, args) {
	args = _.extend(config, args || {});
	if (OS_IOS && Ti.UI.iOS.createAnimator) {
		return showIOS7(msg, args);
	} else if (OS_ANDROID) {
		return showAndroid(msg, args);
	} else {
		return showBasic(msg, args);
	}
}
exports.show = show;
