/**********************************

NODE!

**********************************/

Node.COLORS = {
	0: "#EA3E3E", // red
	1: "#EA9D51", // orange
	2: "#FEEE43", // yellow
	3: "#BFEE3F", // green
	4: "#7FD4FF", // blue
	5: "#A97FFF" // purple
};

function Node(model, config){

	var self = this;
	self._CLASS_ = "Node";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	_configureProperties(self, config, {
		id: Node._getUID,
		x: 0,
		y: 0,
		init: 1, // initial value!
		label: "?",
		hue: 0,
		radius: 50
	});

	// Value: from -1 to 1
	self.value = 0;
	self.nextValue = self.value; // for synchronous update

	// MOUSE.
	var _controlsVisible = false;
	var _controlsAlpha = 0;
	var _controlsDirection = 0;
	var _controlsSelected = false;
	var _controlsPressed = false;	
	var _listenerMouseMove = subscribe("mousemove", function(){

		// ONLY WHEN PLAYING
		if(self.loopy.mode!=Loopy.MODE_PLAY) return;

		// If moused over this, show it, or not.
		_controlsSelected = self.isPointInNode(Mouse.x, Mouse.y);
		if(_controlsSelected){
			_controlsVisible = true;
			_controlsDirection = (Mouse.y<self.y) ? 1 : -1;
		}else{
			_controlsVisible = false;
			_controlsDirection = 0;
		}

	});
	var _listenerMouseDown = subscribe("mousedown",function(){
		if(self.loopy.mode!=Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		if(_controlsSelected) _controlsPressed = true;
	});
	var _listenerMouseUp = subscribe("mouseup",function(){
		if(self.loopy.mode!=Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		_controlsPressed = false;
	});

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

		// When actually playing the simulation...
		var _isPlaying = (self.loopy.mode==Loopy.MODE_PLAY);

		// Otherwise, value = initValue exactly
		if(self.loopy.mode==Loopy.MODE_EDIT){
			self.value = self.init;
			self.nextValue = self.value;
		}

		// Cursor!
		if(_controlsSelected) Mouse.showCursor("pointer");

		// Synchronous update
		if(_isPlaying && _controlsPressed){
			self.value += _controlsDirection*speed;
		}else{
			self.value = self.nextValue;
		}

		// Keep value within bounds!
		self.bound();

		// Synchronous update
		self.nextValue = self.value;

		// Visually & vertically bump the node
		var gotoAlpha = _controlsVisible ? 1 : 0;
		_controlsAlpha = _controlsAlpha*0.5 + gotoAlpha*0.5;
		if(_isPlaying && _controlsPressed){
			_offsetGoto = -_controlsDirection*25; // by 25 pixels
		}else{
			_offsetGoto = 0;
		}
		_offsetY += _offsetVel;
		_offsetVel += _offsetAcc;
		_offsetVel *= _offsetDamp;
		_offsetAcc = (_offsetGoto-_offsetY)*_offsetHookes;

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
		ctx.translate(x,y+_offsetY);
		
		// White-gray bubble
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.TAU, false);
		ctx.fillStyle = "#eee";
		ctx.fill();

		// Colored bubble
		ctx.beginPath();
		var _circleRadiusGoto = r*(self.value+1)*0.5; // radius
		//var _circleRadiusGoto = r*Math.sqrt(self.value+1); // area
		_circleRadius = _circleRadius*0.5 + _circleRadiusGoto*0.5;
		ctx.arc(0, 0, _circleRadius, 0, Math.TAU, false);
		ctx.fillStyle = Node.COLORS[self.hue];
		ctx.fill();

		// Dark alpha bubble
		ctx.beginPath();
		ctx.arc(0, 0, r/2, 0, Math.TAU, false);
		ctx.fillStyle = "rgba(0,0,0,0.1)";
		ctx.fill();
		/*ctx.strokeStyle = "rgba(0,0,0,0.1)";
		ctx.lineWidth = 6;
		ctx.stroke();*/

		// Text!
		ctx.font = "100 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#000";
		ctx.fillText(self.label, 0, 0);

		// Controls!
		var cl = 40;
		var cy = 0;
		ctx.globalAlpha = _controlsAlpha;
		ctx.strokeStyle = "#000";
		// top arrow
		ctx.beginPath();
		ctx.moveTo(-cl,-cy-cl);
		ctx.lineTo(0,-cy-cl*2);
		ctx.lineTo(cl,-cy-cl);
		ctx.lineWidth = (_controlsDirection>0) ? 10: 3;
		ctx.stroke();
		// bottom arrow
		ctx.beginPath();
		ctx.moveTo(-cl,cy+cl);
		ctx.lineTo(0,cy+cl*2);
		ctx.lineTo(cl,cy+cl);
		ctx.lineWidth = (_controlsDirection<0) ? 10: 3;
		ctx.stroke();

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL NODE /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Kill Listeners!
		unsubscribe("mousemove",_listenerMouseMove);
		unsubscribe("mousedown",_listenerMouseDown);
		unsubscribe("mouseup",_listenerMouseUp);

		// Remove from parent!
		model.removeNode(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.isPointInNode = function(x, y, buffer){
		buffer = buffer || 0;
		return _isPointInCircle(x, y, self.x, self.y, self.radius+buffer);
	};

}

////////////////////////////
// Unique ID identifiers! //
////////////////////////////

Node._UID = 0;
Node._getUID = function(){
	Node._UID++;
	return Node._UID;
};
