/*

Toast module
Author: Flavio De Stefano
Company: Caffeina SRL

Provide a toast notification

*/

var config = {
	timeout: 4000,
	backgroundColor: '#B000',
	color: '#fff'
};

exports.show = show = function(msg, args) {
	args = _.extend(config, args || {});

	if (OS_IOS) {
		return (function(){

			var $view = Ti.UI.createWindow({
				top: -20,
				height: 20,
				backgroundColor: args.background,
				fullscreen: true,
				touchEnabled: false
			});

			$view.addEventListener('touchstart', function(e){
				clearTimeout(timeout);
				$view.animate({ top: -20 }, function(){ $view.close(); });
			});

			$view.add(Ti.UI.createLabel({
				text: msg,
				touchEnabled: false,
				left: 10,
				right: 10,
				height: 20,
				color: args.color,
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
				font: {
					fontSize: 12
				}
			}));

			$view.open();
			$view.animate({ top: 0 });

			var timeout = setTimeout(function(){
				$view.animate({ top: -20 }, function(){ $view.close(); });
			}, args.timeout);

			return $view;

		})();
	} else if (OS_ANDROID) {

		return (function(){

			var toast = Ti.UI.createNotification({
				message: msg,
				duration: args.timeout
			});
			toast.show();
			return toast;

		})();

	}

};

exports.init = function(c) {
	config = _.extend(config, c);
};