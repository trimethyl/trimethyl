var config = {};

var onTiltCallbacks = [];

exports.onTilt = on_tilt = function(callback) {
	if (Ti.Platform.model==='Simulator' || Ti.Platform.model.indexOf('sdk')!==-1){
		console.log("Accelerometer doesn't work on virtual devices, so we simulate it NOW!");
		var i = 0;
		setInterval(function(){
			var x = Math.sin(i+=0.05);
			callback({
				x: x,
				y: 0,
				z: 0
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

exports.offTilt = off_tilt = function(callback) {
	if (callback) Ti.Accelerometer.removeEventListener('update', callback);
	else {
		_.each(onTiltCallbacks, function(_callback){
			Ti.Accelerometer.removeEventListener('update', _callback);
		});
	}
};

exports.init = function(c){
	config = _.extend(config, c);
};