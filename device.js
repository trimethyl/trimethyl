var config = {};

var onTiltCallbacks = [];

exports.onTilt = onTilt = function(callback) {
	if (Ti.Platform.model==='Simulator' || Ti.Platform.model.indexOf('sdk')!==-1){
		console.warn("Accelerometer doesn't work on virtual devices.");

		/* Simulator havent accelerometer, so we simualte it now */
		var i = 0;
		setInterval(function(){
			callback({
				x: Math.cos(i+=0.1),
				y: 0
			});
		}, 100);
		return;
	}

	onTiltCallbacks.push(callback);
	Ti.Accelerometer.addEventListener('update', callback);

	// remove listener on android to preserve battery life
	if (OS_ANDROID){
		Ti.Android.currentActivity.addEventListener('pause', function(e) {
			Ti.Accelerometer.removeEventListener('update', callback);
		});
		Ti.Android.currentActivity.addEventListener('resume', function(e) {
			Ti.Accelerometer.addEventListener('update', callback);
		});
	}
};

exports.offTilt = offTilt = function(callback) {
	if (callback) {
		Ti.Accelerometer.removeEventListener('update', callback);
	} else {
		_.each(onTiltCallbacks, function(_callback){
			Ti.Accelerometer.removeEventListener('update', _callback);
		});
	}
};

exports.init = function(c){
	config = _.extend(config, c);
};