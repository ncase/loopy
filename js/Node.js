/**********************************

NODE!

**********************************/

function Node(model, config){

	var self = this;
	self.model = model;
	self.config = config;

	// Properties
	self.id = config.id;
	self.x = config.x;
	self.y = config.y;

	// Value: from -100 to 100
	self.value = config.value;
	self.nextValue = self.value; // for synchronous update

	// MOUSE.
	var _controlsVisible = false;
	var _controlsAlpha = 0;
	var _controlsDirection = 0;
	var _controlsSelected = true;
	var _controlsPressed = false;
	var _controlsTicker = -1;
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
			_controlsTicker = 6;
			self.value += _controlsDirection*50;
		}
	});
	subscribe("mouseup",function(){
		_controlsPressed = false;
		_controlsTicker = -1;
	});

	// Update!
	var _offsetY = 0;
	var _offsetGoto = 0;
	var _offsetVel = 0;
	var _offsetAcc = 0;
	var _offsetDamp = 0.3;
	var _offsetHookes = 0.8;
	self.update = function(speed){

		// Cursor!
		if(_controlsSelected) Mouse.showCursor("pointer");

		// Synchronous update
		if(_controlsPressed){
			if(_controlsTicker--<0){
				self.value += _controlsDirection*5;
			}
		}else{
			self.value = self.nextValue;
		}

		// Keep value within bounds!
		if(self.value<-100) self.value=-100;
		if(self.value>100) self.value=100;
		// if(Math.abs(self.value)<0.1) self.value=0;

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

	};

	// Draw
	self.draw = function(ctx){

		// Retina
		var x = self.x*2;
		var y = self.y*2;
		var r = model.meta.radius*2;

		// Translate!
		ctx.save();
		ctx.translate(x,y+_offsetY);
		//ctx.globalAlpha = 0.5;

		// Draw circle!
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.TAU, false);
		ctx.lineWidth = 10;

		// Now... color that circle, based on VALUE
		var color = "hsl("+config.hue+",";
		var val = Math.abs(self.value/100);
		color += Math.round(val*80) + "%,"; // from 0 to 80
		color += Math.round(78-val*20) + "%)"; // from 78 to 60

		// Fill or outline?
		if(self.value>=0){ // if positive, FILL
			ctx.fillStyle = color;
			ctx.fill();
		}else{
			ctx.fillStyle = "#fff";
			ctx.fill();
		}
		// negative or not, OUTLINE
		ctx.strokeStyle = color;
		ctx.stroke();

		// Text!
		ctx.font = "300 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		var textcolor;
		if(self.value>=0){
			textcolor = "#fff"; // if positive, WHITE
		}else{
			textcolor = color; // if negative, OUTLINE
		}
		ctx.fillStyle = textcolor;
		ctx.fillText(config.label, 0, 0);

		// Controls!
		var cl = 30;
		var cy = 20;
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

		// Restore
		ctx.restore();

	};

}