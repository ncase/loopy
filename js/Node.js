/**********************************

NODE!

**********************************/

function Node(model, config){

	var self = this;
	self.model = model;
	self.config = config;

	// Default values...
	_configureProperties(self, config, {
		id: Node._getUID,
		x: 0,
		y: 0,
		value: 1,
		label: "?",
		hue: 0,
		radius: 50
	});

	// Value: from -1 to 1
	self.nextValue = self.value; // for synchronous update

	// MOUSE.
	/*
	var _controlsVisible = false;
	var _controlsAlpha = 0;
	var _controlsDirection = 0;
	var _controlsSelected = true;
	var _controlsPressed = false;
	// var _controlsTicker = -1;
	subscribe("mousemove", function(){
		var dx = Mouse.x-self.x;
		var dy = Mouse.y-self.y;
		var r = model.meta.radius;
		_controlsSelected = (dx*dx+dy*dy < r*r);
		if(_controlsSelected){
			_controlsVisible = true;
			_controlsDirection = (dy<0) ? 1 : -1;
		}else{
			_controlsVisible = false;
			_controlsDirection = 0;
		}
	});
	subscribe("mousedown",function(){
		if(_controlsSelected){
			_controlsPressed = true;
			//_controlsTicker = 6;
			//self.value += _controlsDirection*50;
			self.bound();
		}
	});
	subscribe("mouseup",function(){
		_controlsPressed = false;
		// _controlsTicker = -1;
	});
	*/

	//////////////////////////////////////
	// UPDATE & DRAW /////////////////////
	//////////////////////////////////////

	// Update!
	var _offsetY = 0;
	var _offsetGoto = 0;
	var _offsetVel = 0;
	var _offsetAcc = 0;
	var _offsetDamp = 0.3;
	var _offsetHookes = 0.8;
	self.bound = function(){
		if(self.value<-1) self.value=-1;
		if(self.value>1) self.value=1;
	};
	self.update = function(speed){

		/*

		// Cursor!
		if(_controlsSelected) Mouse.showCursor("pointer");

		// Synchronous update
		if(_controlsPressed){
			//if(_controlsTicker--<0){
			self.value += _controlsDirection*5;
			//}
		}else{
			self.value = self.nextValue;
		}

		// Keep value within bounds!
		self.bound();

		// Synchronous update
		self.nextValue = self.value;

		// Controls!
		var gotoAlpha = _controlsVisible ? 1 : 0;
		_controlsAlpha = _controlsAlpha*0.5 + gotoAlpha*0.5;
		if(_controlsPressed){
			_offsetGoto = -_controlsDirection*15;
		}else{
			_offsetGoto = 0;
		}

		// Offset
		_offsetY += _offsetVel;
		_offsetVel += _offsetAcc;
		_offsetVel *= _offsetDamp;
		_offsetAcc = (_offsetGoto-_offsetY)*_offsetHookes;

		*/

	};

	// Draw
	var _circleRadius = 0;
	self.draw = function(ctx){

		// Retina
		var x = self.x*2;
		var y = self.y*2;
		var r = self.radius*2;

		// Translate!
		ctx.save();
		ctx.translate(x,y);
		// ctx.translate(x,y+_offsetY); // DISABLE move for NOW.
		
		// White bubble
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.TAU, false);
		ctx.fillStyle = "#fff";
		ctx.fill();

		// Colored bubble
		ctx.beginPath();
		var _circleRadiusGoto = r*(self.value+1)*0.5; // radius
		//var _circleRadiusGoto = r*Math.sqrt(self.value+1); // area
		_circleRadius = _circleRadius*0.5 + _circleRadiusGoto*0.5;
		ctx.arc(0, 0, _circleRadius, 0, Math.TAU, false);
		ctx.fillStyle = "hsl("+self.hue+",80%,58%)";
		ctx.fill();

		// Outline
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.TAU, false);
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#000";
		ctx.stroke();

		// Text!
		ctx.font = "300 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		var textcolor = "#000";
		ctx.fillStyle = textcolor;
		ctx.fillText(self.label, 0, 0);

		// Controls!
		/*
		var cl = 30;
		var cy = 0;
		ctx.globalAlpha = _controlsAlpha;
		ctx.strokeStyle = textcolor;
		// top arrow
		ctx.beginPath();
		ctx.moveTo(-cl,-cy-cl);
		ctx.lineTo(0,-cy-cl*2);
		ctx.lineTo(cl,-cy-cl);
		ctx.lineWidth = (_controlsDirection>0) ? 7: 3;
		ctx.stroke();
		// bottom arrow
		ctx.beginPath();
		ctx.moveTo(-cl,cy+cl);
		ctx.lineTo(0,cy+cl*2);
		ctx.lineTo(cl,cy+cl);
		ctx.lineWidth = (_controlsDirection<0) ? 7: 3;
		ctx.stroke();
		*/

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.isPointInNode = function(x, y, buffer){
		
		// how far outside the circle before NOT "in" node?
		buffer = buffer || 0;
		
		// Point distance
		var dx = self.x-x;
		var dy = self.y-y;
		var dist2 = dx*dx + dy*dy;

		// My radius (with buffer)
		var r = self.radius+buffer;
		var r2 = r*r;

		// Inside?
		return dist2<=r2;

	};

}

////////////////////////////
// Unique ID identifiers! //
////////////////////////////

Node._UID = 0;
Node._getUID = function(){
	return(Node._UID++);
};
