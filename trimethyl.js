/**
 * @class  Trimethyl
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 * The framework initializator
 */

var Util = require('util');
var Device 	= require('device');

var launchURL = Util.parseSchema();
var pauseURL = null;

if (OS_IOS) {

	Ti.App.addEventListener('pause', function(){
		pauseURL = launchURL;
		Ti.App.fireEvent('app.paused');
	});

	Ti.App.addEventListener('resumed', function() {
		launchURL = Util.parseSchema();
		if (launchURL!==pauseURL) {
			Ti.App.fireEvent('app.resumed', { url: launchURL });
		}
	});

}

// Set some TSS vars
//
Alloy.Globals.SCREEN_WIDTH 		= Device.getScreenWidth();
Alloy.Globals.SCREEN_HEIGHT 		= Device.getScreenHeight();
Alloy.Globals.SCREEN_DENSITY 		= Device.getScreenDensity();
Alloy.Globals.IOS7 					= Util.isIOS7();

// Prototype!

String.prototype.zeroFy = function(n) {
	if (this.length<=n) {
		var zeros = ''; for (var i=0; i<n; i++) zeros += '0';
		return zeros + this.toString();
	}
	return this.toString();
};

Number.prototype.numberFormat = function(decimals, dec_point, thousands_sep) {
	var number = this;
	number = (number + '')
	.replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
	prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
	sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
	dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
	s = '',
	toFixedFix = function (n, prec) {
		var k = Math.pow(10, prec);
		return '' + (Math.round(n * k) / k)
		.toFixed(prec);
	};
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
	.split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}
	if ((s[1] || '')
	.length < prec) {
		s[1] = s[1] || '';
	s[1] += new Array(prec - s[1].length + 1)
	.join('0');
}
return s.join(dec);
};