/**********************************

NODE!

**********************************/

Node.COLORS = {
	0: "#EA3E3E", // red
	1: "#EA9D51", // orange
	2: "#FEEE43", // yellow
	3: "#BFEE3F", // green
	4: "#7FD4FF", // blue
	5: "#A97FFF", // purple
	6: "#DDDDDD"  // light grey -> died
};


Node.DEFAULT_RADIUS = 60;

function Node(model, config){

	const self = this;
	self._CLASS_ = "Node";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	const defaultProperties = {
		id: Node._getUID,
		x: 0,
		y: 0,
		radius: Node.DEFAULT_RADIUS,
	};
	injectedDefaultProps(defaultProperties,objTypeToTypeIndex("node"));
	_configureProperties(self, config, defaultProperties);
	// Value: from 0 to 1
	self.value = self.init;
	// TODO: ACTUALLY VISUALIZE AN INFINITE RANGE
	self.bound = function(){ // bound ONLY when changing value.
		/*var buffer = 1.2;
		if(self.value<-buffer) self.value=-buffer;
		if(self.value>1+buffer) self.value=1+buffer;*/
	};

	// MOUSE.
	let _controlsVisible = false;
	let _controlsAlpha = 0;
	let _controlsDirection = 0;
	let _controlsSelected = false;
	let _controlsPressed = false;
	const _listenerMouseMove = subscribe("mousemove", function(){

		// ONLY WHEN PLAYING
		if(self.loopy.mode!==Loopy.MODE_PLAY) return;

		// If moused over this, show it, or not.
		_controlsSelected = self.isPointInNode(Mouse.x, Mouse.y);
		if(_controlsSelected){
			_controlsVisible = true;
			self.loopy.showPlayTutorial = false;
			_controlsDirection = (Mouse.y<self.y) ? 1 : -1;
		}else{
			_controlsVisible = false;
			_controlsDirection = 0;
		}

	});
	const _listenerMouseDown = subscribe("mousedown",function(){

		if(self.loopy.mode!==Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		if(_controlsSelected) _controlsPressed = true;

		// IF YOU CLICKED ME...
		if(_controlsPressed){

			// Change my value
			const delta = _controlsDirection*0.33; // HACK: hard-coded 0.33
			self.live();
			self.takeSignal({
				delta: delta,
				color: self.hue
			});
		}

	});
	const _listenerMouseUp = subscribe("mouseup",function(){
		if(self.loopy.mode!==Loopy.MODE_PLAY) return; // ONLY WHEN PLAYING
		_controlsPressed = false;
	});
	const _listenerReset = subscribe("model/reset", function(){
		self.value = self.init;
		self.reseted=true;
		self.live();
	});

	//////////////////////////////////////
	// SIGNALS ///////////////////////////
	//////////////////////////////////////

	self.sendSignal = function(signal){
		let myEdges = self.model.getEdgesByStartNode(self);
		for(let i=0; i<myEdges.length; i++){
			myEdges[i].addSignal(signal);
		}
	};

	self.takeSignal = function(signal){
		if(loopy.colorLogic && self.foreignColor && signal.color!==self.hue) return; // drop signal
		//if(loopy.colorLogic && loopy.greenLife && signal.color===3) self.live();
		//if(loopy.colorLogic && loopy.redKill && signal.color===0) self.die();
		if(self.died) return;
		if(!self.deltaPool) self.deltaPool=0;
		if(!self.aggregate) self.aggregate = 0;

		if(self.hue === signal.color || loopy.colorLogic===0){
			self.value += signal.delta/self.size;
			self.deltaPool += signal.delta/self.size;
			// Animation
			// _offsetVel += 0.08 * (signal.delta/Math.abs(signal.delta));
			if(signal.delta>0) _offsetVel -= 6 ;
			if(signal.delta<0) _offsetVel += 6 ;
			if(self.aggregate) return;
		}
		self.lastSignalAge = signal.age;
		self.reseted = false;

		if(loopy.colorLogic===0 || self.hue === signal.color){
			self.valueBeforeAggregationPool = self.value - signal.delta/self.size;
		}
		if(self.hue !== signal.color && loopy.colorLogic===1){
			const newSignal = {delta:signal.delta,age:signal.age,color:signal.color,vital:signal.vital};
			self.sendSignal(newSignal);
		}

		const signalSpeedRatio = 8 / Math.pow(2,self.loopy.signalSpeed);
		const aggregateFunc = () => {
			if(self.loopy.mode===Loopy.MODE_PLAY && !self.reseted){
				const newSignal = {delta:self.deltaPool*self.size,age:self.lastSignalAge,color:signal.color,vital:signal.vital};
				// Only propagate beyond threshold
				if(!self.transmissionBehavior) self.sendSignal(newSignal);
				else if (self.value < 0 && self.transmissionBehavior===2) self.die();
				else if(loopy.colorLogic===1){
					if(self.value<0 || self.value>1) self.sendSignal(newSignal);
					else if(self.hue !== newSignal.color) self.sendSignal(newSignal);
				} else if(self.value<0 || self.value>1) self.sendSignal(newSignal);
				if(self.value<0) self.value = 0;
				if(self.value>1) self.value = 1;
			}
			self.aggregate=false;
			self.deltaPool=0;
		};

		if(self.aggregationLatency){
			self.aggregate = setTimeout( aggregateFunc,1000 * self.aggregationLatency * signalSpeedRatio);
		} else aggregateFunc();
	};


	//////////////////////////////////////
	// UPDATE & DRAW /////////////////////
	//////////////////////////////////////

	// Update!
	let _offset = 0;
	let _offsetGoto = 0;
	let _offsetVel = 0;
	let _offsetAcc = 0;
	let _offsetDamp = 0.3;
	let _offsetHookes = 0.8;
	self.update = function(){ //(speed)

		// When actually playing the simulation...
		const _isPlaying = (self.loopy.mode===Loopy.MODE_PLAY);

		// Otherwise, value = initValue exactly
		if(self.loopy.mode===Loopy.MODE_EDIT){
			self.value = self.init;
		}

		// Cursor!
		if(_controlsSelected) Mouse.showCursor("pointer");

		// Keep value within bounds!
		self.bound();

		// Visually & vertically bump the node
		const gotoAlpha = (_controlsVisible || self.loopy.showPlayTutorial) ? 1 : 0;
		_controlsAlpha = _controlsAlpha*0.5 + gotoAlpha*0.5;
		if(_isPlaying && _controlsPressed){
			_offsetGoto = -_controlsDirection*20; // by 20 pixels
			// _offsetGoto = _controlsDirection*0.2; // by scale +/- 0.1
		}else{
			_offsetGoto = 0;
		}
		_offset += _offsetVel;
		if(_offset>40) _offset=40;
		if(_offset<-40) _offset=-40;
		_offsetVel += _offsetAcc;
		_offsetVel *= _offsetDamp;
		_offsetAcc = (_offsetGoto-_offset)*_offsetHookes;

	};

	// Draw
	let _circleRadius = 0;
	self.draw = function(ctx){

		if(self.loopy.mode===Loopy.MODE_PLAY && self.label === "autoplay") return;

		// Retina
		const x = self.x*2;
		const y = self.y*2;
		const r = self.radius*2;
		const color = Node.COLORS[self.hue];

		// Translate!
		ctx.save();
		ctx.translate(x,y+_offset);

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target === self){
			ctx.beginPath();
			ctx.arc(0, 0, r+40, 0, Math.TAU, false);
			ctx.fillStyle = HIGHLIGHT_COLOR;
			ctx.fill();
		}

		// White-gray bubble with colored border
		ctx.beginPath();
		ctx.arc(0, 0, r-2, 0, Math.TAU, false);
		ctx.fillStyle = "#fff";
		ctx.fill();
		ctx.lineWidth = 6;
		ctx.strokeStyle = color;
		ctx.stroke();

		// Circle radius
		// var _circleRadiusGoto = r*(self.value+1);
		// _circleRadius = _circleRadius*0.75 + _circleRadiusGoto*0.25;

		// RADIUS IS (ATAN) of VALUE?!?!?!
		/*
		let _r = Math.atan(self.value*5);
		_r = _r/(Math.PI/2);
		_r = (_r+1)/2;
		*/

		// INFINITE RANGE FOR RADIUS
		// linear from 0 to 1, asymptotic otherwise.
		let _value;
		if(self.value>=0 && self.value<=1){
			// (0,1) -> (0.1, 0.9)
			_value = 0.1 + 0.8*self.value;
		}else{
			if(self.value<0){
				// asymptotically approach 0, starting at 0.1
				_value = (1/(Math.abs(self.value)+1))*0.1;
			}
			if(self.value>1){
				// asymptotically approach 1, starting at 0.9
				_value = 1 - (1/self.value)*0.1;
			}
		}

		// Colored bubble
		ctx.beginPath();
		const _circleRadiusGoto = r*_value; // radius
		_circleRadius = _circleRadius*0.8 + _circleRadiusGoto*0.2;
		ctx.arc(0, 0, _circleRadius, 0, Math.TAU, false);
		ctx.fillStyle = color;
		ctx.fill();

		// Text!
		if(self.label){
			let fontsize = 40;
			ctx.font = "normal "+fontsize+"px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000";
			let width = ctx.measureText(self.label).width;

			while(width > r*1.5){// - 30){ // -30 for buffer. HACK: HARD-CODED.
				fontsize -= 1;
				ctx.font = "normal "+fontsize+"px sans-serif";
				width = ctx.measureText(self.label).width;
			}
			ctx.fillText(self.label, 0, 0);
		}

		// WOBBLE CONTROLS
		const cl = 40;
		let cy = 0;
		if(self.loopy.showPlayTutorial && self.loopy.wobbleControls>0){
			const wobble = self.loopy.wobbleControls*(Math.TAU/30);
			cy = Math.abs(Math.sin(wobble))*10;
		}

		// Controls!
		ctx.globalAlpha = _controlsAlpha;
		ctx.strokeStyle = "rgba(0,0,0,0.8)";
		// top arrow
		ctx.beginPath();
		ctx.moveTo(-cl,-cy-cl);
		ctx.lineTo(0,-cy-cl*2);
		ctx.lineTo(cl,-cy-cl);
		ctx.lineWidth = (_controlsDirection>0) ? 10: 3;
		if(self.loopy.showPlayTutorial) ctx.lineWidth=6;
		ctx.stroke();
		// bottom arrow
		ctx.beginPath();
		ctx.moveTo(-cl,cy+cl);
		ctx.lineTo(0,cy+cl*2);
		ctx.lineTo(cl,cy+cl);
		ctx.lineWidth = (_controlsDirection<0) ? 10: 3;
		if(self.loopy.showPlayTutorial) ctx.lineWidth=6;
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
		unsubscribe("model/reset",_listenerReset);

		// Remove from parent!
		model.removeNode(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// NODE DIE //////////////////////////
	//////////////////////////////////////

	self.die = function(){
		if(!self.died && loopy.colorLogic && loopy.redKill) self.sendSignal({delta:-.33,color:0});
		self.died=true;
		if(self.hue!==6) self.oldhue = self.hue;
		self.hue=6;
		//self.value = 0;
		publish("died",[self]);
	};
	self.live = function(){
		self.died=false;
		self.hue = typeof self.oldhue !== 'undefined'?self.oldhue:self.hue;
		publish("live",[self]);
	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.isPointInNode = function(x, y, buffer){
		buffer = buffer || 0;
		return _isPointInCircle(x, y, self.x, self.y, self.radius+buffer);
	};

	self.getBoundingBox = function(){
		return {
			left: self.x - self.radius,
			top: self.y - self.radius,
			right: self.x + self.radius,
			bottom: self.y + self.radius
		};
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
