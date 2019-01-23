/**
 * @module  matrix
 * @author  Flavio De Stefano <flavio.destefano@caffeinalab.com>
 */

var Alloy = require('alloy');

var Matrix2D = function(){
	this.matrix = Ti.UI.create2DMatrix();
};

function uc(dp) {
	if (OS_ANDROID) return dp * Alloy.Globals.SCREEN_DENSITY;
	return dp;
}

Matrix2D.prototype.translate = Matrix2D.prototype.t = function(x, y) {
	this.matrix = this.matrix.translate( uc(x), uc(y) );
	return this;
};

Matrix2D.prototype.scale = Matrix2D.prototype.s = function(factor) {
	this.matrix = this.matrix.scale(factor);
	return this;
};

Matrix2D.prototype.rotate = Matrix2D.prototype.r = function(angle, toAngle) {
	this.matrix = this.matrix.rotate(angle, toAngle);
	return this;
};

Matrix2D.i = Matrix2D.identity = function() {
	return new Matrix2D();
};

module.exports = Matrix2D;