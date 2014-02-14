var config = {};

exports.onMoving = function(callback) {
	Ti.Geolocation.addEventListener('heading', callback);
};

exports.onTilt = function(callback) {
	if (Ti.Platform.model==='Simulator' || Ti.Platform.model.indexOf('sdk')!==-1){
		console.log("Accelerometer doesn't work on virtual devices, so we simulate it NOW!");
		var i = 0;
		setInterval(function(){
			var x = Math.sin(i+=0.05);
			console.log(x);
			callback({
				x: x,
				y: 0,
				z: 0
			});
		}, 10);
		return;
	}

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

exports.init = function(c){
	config = _.extend(config, c);
};