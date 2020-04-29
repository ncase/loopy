/**********************************

NODE!

**********************************/

LoopyNode.COLORS = {
	0: "#EA3E3E", // red
	1: "#EA9D51", // orange
	2: "#FEEE43", // yellow
	3: "#BFEE3F", // green
	4: "#7FD4FF", // blue
	5: "#A97FFF", // purple
	6: "#DDDDDD",  // light grey -> died
	7: "rgba(0,0,0,.3)"  // node settings
};


LoopyNode.DEFAULT_RADIUS = 60;
LoopyNode._CLASS_ = "Node";

function LoopyNode(model, config){

	const self = this;
	self._CLASS_ = "Node";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	const defaultProperties = {
		radius: LoopyNode.DEFAULT_RADIUS,
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
		if(self.died && !signal.vital) return;
		let myEdges = self.model.getEdgesByStartNode(self);

		const quantitativeAcceptingEdges = [];
		for(let i=0; i<myEdges.length; i++){
			const edge = myEdges[i];
			const newSignal = {
				delta: signal.delta>0?0.33:-0.33,
				color: signal.color,
				age: signal.age,
				vital:signal.vital,
			};

			// random half filtering
			if(edge.filter===5 && Math.random()<.5) continue;
			// vital filtering
			if(edge.filter===1 && signal.vital) continue;
			if(edge.filter===2 && !signal.vital) continue;
			if(edge.filter===2 && signal.delta>0) continue;
			if(edge.filter===3 && !signal.vital) continue;
			if(edge.filter===3 && signal.delta<0) continue;
			if(edge.filter===4 && !signal.vital) continue;
			if(edge.filter>=2 && edge.filter<=4) newSignal.vital = false;
			// vital emitting
			if(edge.quantitative===2 || newSignal.vital) {
				newSignal.vital=true;
				edge.addSignal(newSignal);
				continue;
			}
			if(edge.to.died) continue;

			// Sign constraint filtering
			if(edge.signBehavior===2 && signal.delta>0) continue;
			if(edge.signBehavior===3 && signal.delta<0) continue;

			// vital banalized emitting
			if(edge.filter>=2 && edge.filter<=4) {
				edge.addSignal(newSignal);
				continue;
			}

			// Color constraint filtering
			if(loopy.colorLogic===1 && edge.edgeFilterColor!== -1 && edge.edgeFilterColor !== signal.color) continue;

			if(loopy.colorLogic===1 && self.hue !== signal.color) {
				if(edge.quantitative===0) edge.addSignal(newSignal);
				if(edge.quantitative===1) quantitativeAcceptingEdges.push(edge);
				continue;
			}

			// Threshold filtering
			if(self.value<self.overflow && signal.delta>0) continue;
			if(self.value>self.underflow && signal.delta<0) continue;

			if(edge.quantitative===0) edge.addSignal(newSignal);
			if(edge.quantitative===1) quantitativeAcceptingEdges.push(edge);
		}
		// Quantitative handling

		if(quantitativeAcceptingEdges.length){
			let delta;
			if( (loopy.colorLogic===1 && self.hue !== signal.color)
				|| (self.value>=self.overflow && self.value<=self.underflow)
			) delta = signal.delta;
			if(loopy.colorLogic===0 || self.hue === signal.color){
				if(self.value>self.overflow) delta = (self.value-self.overflow)*self.size;
				else if(self.value<self.underflow) delta = (self.value-self.underflow)*self.size;
				else console.warn(`how can we be here ? value: ${self.value} underflow: ${self.underflow} overflow: ${self.overflow}`);
				self.value -= delta/self.size;
			}
			signal.delta = delta/quantitativeAcceptingEdges.length;
			for(let i=0; i<quantitativeAcceptingEdges.length; i++) quantitativeAcceptingEdges[i].addSignal(signal);
		}

		if(self.value<0) self.value = 0;
		if(self.value>1) self.value = 1;
	};

	self.takeSignal = function(signal,fromEdge=undefined){
		if(loopy.colorLogic && self.foreignColor && signal.color!==self.hue) return; // drop signal
		if(signal.vital && signal.delta>0) return self.live(signal);
		if(signal.vital && signal.delta<0) return self.die(signal);
		if(self.died) return;
		if(loopy.colorLogic && fromEdge && fromEdge.edgeTargetColor===-3) return self.hue = signal.color;
		if(!self.deltaPool) self.deltaPool=0;
		if(!self.aggregate) self.aggregate = 0;

		if(self.hue === signal.color || loopy.colorLogic===0){
			self.value += signal.delta/self.size;
			self.deltaPool += signal.delta/self.size;
			// Animation
			// _offsetVel += 0.08 * (signal.delta/Math.abs(signal.delta));
			if(signal.delta>0) _offsetVel -= 6 ;
			if(signal.delta<0) _offsetVel += 6 ;

			// Implode ?
			if((self.explode === -1 || self.explode === 2) && self.value<0){
				self.value = 0;
				return self.die(signal);
			}
			// Explode ?
			if((self.explode === 1 || self.explode === 2) && self.value>1) {
				self.value = 1;
				return self.die(signal);
			}

			if(self.aggregate) return;
		}
		self.lastSignalAge = signal.age;
		self.reseted = false;

		if(loopy.colorLogic===0 || self.hue === signal.color){
			self.valueBeforeAggregationPool = self.value - signal.delta/self.size;
		}
		if(loopy.colorLogic===1 && self.hue !== signal.color){
			const newSignal = {delta:signal.delta,age:signal.age,color:signal.color,vital:signal.vital};
			return self.sendSignal(newSignal);
		}

		const signalSpeedRatio = 8 / Math.pow(2,self.loopy.signalSpeed);
		const aggregateFunc = () => {
			if(self.loopy.mode===Loopy.MODE_PLAY && !self.reseted){
				const newSignal = {
					delta:self.deltaPool*self.size,
					age:self.lastSignalAge,
					color:signal.color,
					vital:signal.vital
				};
				self.sendSignal(newSignal);
			}
			self.aggregate=false;
			self.deltaPool=0;
		};

		if(self.aggregationLatency){
			self.aggregate = setTimeout( aggregateFunc,1000 * self.aggregationLatency * signalSpeedRatio);
			self.aggregateStartTime = Date.now();
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
		const color = LoopyNode.COLORS[self.hue];

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
		if(self.foreignColor){
			ctx.beginPath();
			ctx.arc(0, 0, r+8, 0, Math.TAU, false);
			ctx.fillStyle = "#fff";
			ctx.fill();
			ctx.lineWidth = 6;
			ctx.strokeStyle = color;
			ctx.stroke();
		}
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

		if(self.overflow>0){
			const arrow = (angle)=>{
				ctx.save();
				ctx.beginPath();
				const oR = r*self.overflow;
				const size = 1;
				radialMove(ctx,angle,oR,size,-0.05,0);
				radialLine(ctx,angle,oR,size,0,0.05);
				radialLine(ctx,angle,oR,size,0.05,0);
				ctx.lineWidth = 2;
				ctx.strokeStyle = Label.COLORS[self.hue];//LoopyNode.COLORS[7];
				ctx.stroke();
				ctx.restore();
			}
			for(let a = 0; a < 2*Math.PI;a+=Math.PI*0.125) arrow(a);
		}
		if(self.underflow<1){
			const arrow = (angle)=>{
				ctx.save();
				ctx.beginPath();
				const oR = r*self.underflow;
				const size = 1;
				radialMove(ctx,angle,oR,size,-0.05,0);
				radialLine(ctx,angle,oR,size,0,-0.05);
				radialLine(ctx,angle,oR,size,0.05,0);
				ctx.lineWidth = 2;
				ctx.strokeStyle = Label.COLORS[self.hue];//LoopyNode.COLORS[7];
				ctx.stroke();
				ctx.restore();
			}
			for(let a = -Math.PI*0.125/2; a < 2*Math.PI;a+=Math.PI*0.125) arrow(a);
		}
		if(self.aggregationLatency>0){
			// show aggregationLatency visual
			ctx.save();
			ctx.beginPath();
			const size = 1.8;
			ctx.moveTo(0,-r);
			ctx.lineTo(-0.05*r*size,-r*(1-0.01*size));
			ctx.lineTo(-0.05*r*size,-r*(1+0.05*size));
			ctx.lineTo(-0.1*r*size,-r*(1+0.05*size));
			ctx.lineTo(-0.1*r*size,-r*(1+0.1*size));
			ctx.lineTo(0.1*r*size,-r*(1+0.1*size));
			ctx.lineTo(0.1*r*size,-r*(1+0.05*size));
			ctx.lineTo(0.05*r*size,-r*(1+0.05*size));
			ctx.lineTo(0.05*r*size,-r*(1-0.01*size));
			ctx.fillStyle = color;
			ctx.fill();

			const chronoPart = (baseAngle,size)=>{
				ctx.beginPath();
				const line = (rx,ry)=>radialLine(ctx,baseAngle,r,size,rx,ry);
				ctx.moveTo(Math.cos(baseAngle)*r,Math.sin(baseAngle)*r);
				const xMax = .075;
				line(-xMax,0)
				line(-xMax,.05)
				line(-(xMax-.025),.075)
				line((xMax-.025),.075)
				line(xMax,.05)
				line(xMax,0)
				ctx.fillStyle = color;
				ctx.fill();
			}
			chronoPart(Math.PI*-0.25,size*0.75);
			chronoPart(Math.PI*-0.75,size*0.75);

			ctx.beginPath();
			// actual aggregation timer
			const signalSpeedRatio = 8 / Math.pow(2,self.loopy.signalSpeed);
			const timerLength = r*4/5;
			const timeRatio = self.aggregate?(Date.now()-self.aggregateStartTime)/(1000 * self.aggregationLatency * signalSpeedRatio):0;
			const timerAngle = Math.PI*(-0.5+2*timeRatio);
			ctx.moveTo(Math.cos(timerAngle)*timerLength,Math.sin(timerAngle)*timerLength);
			ctx.lineTo(0,0);
			// config aggregation
			const directions = {
				0.1:Math.PI*-0.44,
				0.2:Math.PI*-0.33,
				0.4:Math.PI*-0.11,
				0.8:Math.PI*0.11,
				1.6:Math.PI*0.33,
				3.2:Math.PI*0.7,
				6.4:Math.PI*1.25,
			};
			const clockHandLength = r*2/3;
			const clockHandAngle = directions[self.aggregationLatency];
			ctx.lineTo(Math.cos(clockHandAngle)*clockHandLength,Math.sin(clockHandAngle)*clockHandLength);

			ctx.lineWidth = 6;
			ctx.strokeStyle = Label.COLORS[self.hue];//LoopyNode.COLORS[7];
			ctx.stroke();
			ctx.restore();

		}
		if(self.explode === -1 || self.explode === 2){
			// show this node can implode
			const line = (angle)=>{
				ctx.save();
				ctx.beginPath();
				const size = 1;
				radialMove(ctx,angle,r*0.1,size,0,0);
				radialLine(ctx,angle,r*0.33,size,0,0);
				ctx.lineWidth = 16;
				ctx.strokeStyle = Label.COLORS[self.hue];//LoopyNode.COLORS[7];
				ctx.stroke();
				ctx.restore();
			}
			for(let a = 0; a < 2*Math.PI;a+=Math.PI*0.5) line(a);
		}
		if(self.explode === 1 || self.explode === 2){
			// show this node can explode
			const line = (angle)=>{
				ctx.save();
				ctx.beginPath();
				const size = 1;
				radialMove(ctx,angle,r*1.25,size,0,0);
				radialLine(ctx,angle,r*1.5,size,0,0);
				ctx.lineWidth = 8;
				ctx.strokeStyle = Label.COLORS[self.hue];//LoopyNode.COLORS[7];
				ctx.stroke();
				ctx.restore();
			}
			for(let a = 0; a < 2*Math.PI;a+=Math.PI*0.25) line(a);
		}

		// Text!
		if(self.label){
			let fontsize = 40;
			ctx.font = "normal "+fontsize+"px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000";
			let width = ctx.measureText(self.label).width;

			while(width > r*2 - 30){// - 30){ // -30 for buffer. HACK: HARD-CODED.
				fontsize -= 1;
				ctx.font = "normal "+fontsize+"px sans-serif";
				width = ctx.measureText(self.label).width;
			}
			ctx.fillStyle = "rgba(100%,100%,100%,.15)";
			const padding = 3;
			for(let x=-padding;x<=padding;x++)for(let y=-padding;y<=padding;y++) ctx.fillText(self.label, x, y);
			ctx.fillStyle = "#000";
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

	self.die = function(signal){
		if(!self.died && self.loopy.mode===Loopy.MODE_PLAY) self.sendSignal({delta:-.33,color:signal?signal.color:self.hue,vital:true});
		self.died=true;
		if(self.hue!==6) self.oldhue = self.hue;
		self.hue=6;
		publish("died",[self]);
	};
	self.live = function(signal){
		if(self.died && self.loopy.mode===Loopy.MODE_PLAY) self.sendSignal({delta:.33,color:signal?signal.color:self.hue,vital:true});
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
function radialLine (ctx,baseAngle,baseR,size,rx,ry){
	ctx.lineTo(Math.cos(baseAngle+rx*size)*baseR*(1+ry*size),Math.sin(baseAngle+rx*size)*baseR*(1+ry*size));
}
function radialMove (ctx,baseAngle,baseR,size,rx,ry){
	ctx.moveTo(Math.cos(baseAngle+rx*size)*baseR*(1+ry*size),Math.sin(baseAngle+rx*size)*baseR*(1+ry*size));
}
