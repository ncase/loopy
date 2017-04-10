/**********************************

EDGE!

**********************************/

Edge.allSignals = [];
Edge.MAX_SIGNALS = 100;
Edge.MAX_SIGNALS_PER_EDGE = 10;
Edge.defaultStrength = 1;

function Edge(model, config){

	var self = this;
	self._CLASS_ = "Edge";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	_configureProperties(self, config, {
		from: _makeErrorFunc("CAN'T LEAVE 'FROM' BLANK"),
		to: _makeErrorFunc("CAN'T LEAVE 'TO' BLANK"),
		arc: 100,
		rotation: 0,
		strength: Edge.defaultStrength
	});

	// Get my NODES
	self.from = model.getNode(self.from);
	self.to = model.getNode(self.to);

	// We have signals!
	self.signals = [];
	self.signalSpeed = 0;
	self.addSignal = function(signal){

		// IF ALREADY TOO MANY, FORGET IT
		if(Edge.allSignals.length>Edge.MAX_SIGNALS){
			return;
		}

		// IF TOO MANY *ON THIS EDGE*, FORGET IT
		if(self.signals.length>Edge.MAX_SIGNALS_PER_EDGE){
			return;
		}

		// Re-create signal
		var delta = signal.delta;
		var age;
		if(signal.age===undefined){
			// age = 13; // cos divisible by 1,2,3,4 + 1
			age = 1000000; // actually just make signals last "forever".
		}else{
			age = signal.age-1;
		}
		var newSignal = {
			delta: delta,
			position: 0,
			scaleX: Math.abs(delta),
			scaleY: delta,
			age: age
		};

		// If it's expired, forget it.
		if(age<=0) return;

		self.signals.unshift(newSignal); // it's a queue!

		// ALL signals.
		Edge.allSignals.push(newSignal);

	};
	self.updateSignals = function(){

		// Speed?
		var speed = Math.pow(2,self.loopy.signalSpeed);
		self.signalSpeed = speed/self.getArrowLength();

		// Move all signals along
		for(var i=0; i<self.signals.length; i++){
			
			var signal = self.signals[i];
			var lastPosition = signal.position;
			signal.position += self.signalSpeed;

			// If crossed the 0.5 mark...
			/*
			if(lastPosition<0.5 && signal.position>=0.5){

				// Multiply by this edge's strength!
				signal.delta *= self.strength;

			}

			// And also TWEEN the scale.
			var gotoScaleX = Math.abs(signal.delta);
			var gotoScaleY = signal.delta;
			signal.scaleX = signal.scaleX*0.8 + gotoScaleX*0.2;
			signal.scaleY = signal.scaleY*0.8 + gotoScaleY*0.2;
			*/

		}

		// If any signals reach >=1, pass 'em along
		var lastSignal = self.signals[self.signals.length-1];
		while(lastSignal && lastSignal.position>=1){

			// Actually pass it along
			lastSignal.delta *= self.strength; // flip at the end only!
			self.to.takeSignal(lastSignal);
			
			// Pop it, move on down
			self.removeSignal(lastSignal);
			lastSignal = self.signals[self.signals.length-1];

		}

	};
	self.removeSignal = function(signal){
		self.signals.splice( self.signals.indexOf(signal), 1 );
		Edge.allSignals.splice( Edge.allSignals.indexOf(signal), 1 );
	};
	self.drawSignals = function(ctx){
	
		// Draw each one
		for(var i=0; i<self.signals.length; i++){

			// Get position to draw at
			var signal = self.signals[i];
			var signalPosition = self.getPositionAlongArrow(signal.position);
			var signalX = signalPosition.x;
			var signalY = signalPosition.y;

			// Transform
			ctx.save();
			ctx.translate(signalX, signalY);
			ctx.rotate(-a);

			// Signal's direction & size
			var size = 40; // HARD-CODED
			ctx.scale(signal.scaleX, signal.scaleY);
			ctx.scale(size, size);

			// Signal's COLOR, BLENDING
			var fromColor = Node.COLORS[self.from.hue];
			var toColor = Node.COLORS[self.to.hue];
			var blend;
			var bStart=0.4, bEnd=0.6;
			if(signal.position<bStart){
				blend = 0;
			}else if(signal.position<bEnd){
				blend = (signal.position-bStart)/(bEnd-bStart);
			}else{
				blend = 1;
			}
			var signalColor = _blendColors(fromColor, toColor, blend);

			// Also, tween the scaleY, flipping, IF STRENGTH<0
			if(self.strength<0){
				// sin/cos-animate it for niceness.
				var flip = Math.cos(blend*Math.PI); // (0,1) -> (1,-1)
				ctx.scale(1, flip);
			}

			// Signal's age = alpha.
			if(signal.age==2){
				ctx.globalAlpha = 0.5;
			}else if(signal.age==1){
				ctx.globalAlpha = 0.25;
			}

			// Draw an arrow
			ctx.beginPath();
			ctx.moveTo(-2,0);
			ctx.lineTo(0,-2);
			ctx.lineTo(2,0);
			ctx.lineTo(1,0);
			ctx.lineTo(1,2);
			ctx.lineTo(-1,2);
			ctx.lineTo(-1,0);
			ctx.fillStyle = signalColor;
			ctx.fill();

			// Restore
			ctx.restore();

		}

	};
	var _listenerReset = subscribe("model/reset", function(){
		self.signals = [];
		Edge.allSignals = [];
	});


	//////////////////////////////////////
	// UPDATE & DRAW /////////////////////
	//////////////////////////////////////

	// Update!
	self.labelX = 0;
	self.labelY = 0;
	var fx, fy, tx, ty,
		r, dx, dy, w, a, h,
		y, a2,
		arrowBuffer, arrowDistance, arrowAngle, beginDistance, beginAngle,
		startAngle, endAngle,
		y2, begin, end,
		arrowLength, ax, ay, aa,
		labelAngle, lx, ly, labelBuffer; // BECAUSE I'VE LOST CONTROL OF MY LIFE.
	self.update = function(speed){

		////////////////////////////////////////////////
		// PRE-CALCULATE THE MATH (for retina canvas) //
		////////////////////////////////////////////////

		// Edge case: if arc is EXACTLY zero, whatever, add 0.1 to it.
		if(self.arc==0) self.arc=0.1;

		// Mathy calculations: (all retina, btw)
		fx=self.from.x*2;
		fy=self.from.y*2;
		tx=self.to.x*2;
		ty=self.to.y*2;	
		if(self.from==self.to){
			var rotation = self.rotation;
			rotation *= Math.TAU/360;
			tx += Math.cos(rotation);
			ty += Math.sin(rotation);
		}
		dx = tx-fx;
		dy = ty-fy;
		w = Math.sqrt(dx*dx+dy*dy);
		a = Math.atan2(dy,dx);
		h = Math.abs(self.arc*2);

		// From: http://www.mathopenref.com/arcradius.html
		r = (h/2) + ((w*w)/(8*h));
		y = r-h; // the circle's y-pos is radius - given height.
		a2 = Math.acos((w/2)/r); // angle from x axis, arc-cosine of half-width & radius

		// Arrow buffer...
		arrowBuffer = 15;
		arrowDistance = (self.to.radius+arrowBuffer)*2;
		arrowAngle = arrowDistance/r; // (distance/circumference)*TAU, close enough.
		beginDistance = (self.from.radius+arrowBuffer)*2;
		beginAngle = beginDistance/r;

		// Arc it!
		startAngle = a2 - Math.TAU/2;
		endAngle = -a2;
		if(h>r){
			startAngle *= -1;
			endAngle *= -1;
		}
		if(self.arc>0){
			y2 = y;
			begin = startAngle+beginAngle;
			end = endAngle-arrowAngle;
		}else{
			y2 = -y;
			begin = -startAngle-beginAngle;
			end = -endAngle+arrowAngle;
		}

		// Arrow HEAD!
		arrowLength = 10*2;
		ax = w/2 + Math.cos(end)*r;
		ay = y2 + Math.sin(end)*r;
		aa = end + Math.TAU/4;

		// My label is...
		var s = self.strength;
		var l;
		if(s>=3) l="+++";
		else if(s>=2) l="++";
		else if(s>=1) l="+";
		else if(s==0) l="?";
		else if(s>=-1) l="–"; // EM dash, not hyphen.
		else if(s>=-2) l="– –";
		else l="– – –";
		self.label = l;

		// Label position
		var labelPosition = self.getPositionAlongArrow(0.5);
		lx = labelPosition.x;
		ly = labelPosition.y;

		// ACTUAL label position, for grabbing purposes
		self.labelX = (fx + Math.cos(a)*lx - Math.sin(a)*ly)/2; // un-retina
		self.labelY = (fy + Math.sin(a)*lx + Math.cos(a)*ly)/2; // un-retina

		// ...add offset to label
		labelBuffer = 18*2; // retina
		if(self.arc<0) labelBuffer*=-1;
		ly += labelBuffer;

		///////////////////////////////////////
		// AND THEN UPDATE OTHER STUFF AFTER //
		// THE CALCULATIONS ARE DONE I GUESS //
		///////////////////////////////////////

		// When actually playing the simulation...
		/*if(self.loopy.mode==Loopy.MODE_PLAY){
			self.to.nextValue += self.from.value * self.strength * speed;
		}*/

		// Update signals
		self.updateSignals();

	};

	// Get position along arrow, on what parameter?
	self.getArrowLength = function(){
		var angle;
		if(self.from==self.to){
			// angle = Math.TAU;
			return r*Math.TAU - 2*self.from.radius;
		}else{
			//debugger;
			if(y<0){
				// arc's center is above the horizon
				if(self.arc<0){ // ccw
					angle = Math.TAU + begin - end;
				}else{ // cw
					angle = Math.TAU + end - begin;
				}
			}else{
				// arc's center is below the horizon
				angle = Math.abs(end-begin);
			}
		}
		return r*angle;
	};
	self.getPositionAlongArrow = function(param){

		param = -0.05 + param*1.1; // (0,1) --> (-0.05, 1.05)

		// If the arc's circle is actually BELOW the line...
		var begin2 = begin;
		if(y<0){
			// DON'T KNOW WHY THIS WORKS, BUT IT DOES.
			if(begin2>0){
				begin2-=Math.TAU;
			}else{
				begin2+=Math.TAU;
			}
		}

		// Get angle!
		var angle = begin2 + (end-begin2)*param;
		
		// return x & y
		return{
			x: w/2 + Math.cos(angle)*r,
			y: y2 + Math.sin(angle)*r
		};

	};

	// Draw
	self.draw = function(ctx){

		// Width & Color
		ctx.lineWidth = 4*Math.abs(self.strength)-2;
		ctx.strokeStyle = "#666";

		// Translate & Rotate!
		ctx.save();
		ctx.translate(fx, fy);
		ctx.rotate(a);

		// Highlight!
		if(self.loopy.sidebar.currentPage.target == self){
			ctx.save();
			ctx.translate(lx, ly);
			ctx.rotate(-a);
			ctx.beginPath();
			ctx.arc(0, 5, 60, 0, Math.TAU, false);
			ctx.fillStyle = HIGHLIGHT_COLOR;
			ctx.fill();
			ctx.restore();
		}

		// Arc it!
		ctx.beginPath();
		if(self.arc>0){
			ctx.arc(w/2, y2, r, startAngle, end, false);
		}else{
			ctx.arc(w/2, y2, r, -startAngle, end, true);
		}

		// Arrow HEAD!
		ctx.save();
		ctx.translate(ax, ay);
		if(self.arc<0) ctx.scale(-1,-1);
		ctx.rotate(aa);
		ctx.moveTo(-arrowLength, -arrowLength);
		ctx.lineTo(0,0);
		ctx.lineTo(-arrowLength, arrowLength);
		ctx.restore();

		// Stroke!
		ctx.stroke();

		// Draw label
		ctx.font = "100 60px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.save();
		ctx.translate(lx, ly);
		ctx.rotate(-a);
		ctx.fillStyle = "#999";
		ctx.fillText(self.label, 0, 0);
		ctx.restore();

		// DRAW SIGNALS
		self.drawSignals(ctx);

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL EDGE /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Kill Listeners!
		unsubscribe("model/reset",_listenerReset);

		// Remove from parent!
		model.removeEdge(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.isPointOnLabel = function(x, y){
		// TOTAL HACK: radius based on TOOL BEING USED.
		var radius;
		if(self.loopy.tool==Loopy.TOOL_DRAG || self.loopy.tool==Loopy.TOOL_INK) radius=40; // selecting, wide radius!
		else if(self.loopy.tool==Loopy.TOOL_ERASE) radius=25; // no accidental erase
		else radius = 15; // you wanna label close to edges
		return _isPointInCircle(x, y, self.labelX, self.labelY, radius);
	};

	self.getBoundingBox = function(){

		// SPECIAL CASE: SELF-ARC
		if(self.from==self.to){

			var perpendicular = a-Math.TAU/4;
			var cx = fx + Math.cos(perpendicular)*-y2;
			var cy = fy + Math.sin(perpendicular)*-y2;
			cx = cx/2; // un-retina
			cy = cy/2; // un-retina

			var _radius = r/2; // un-retina

			return {
				left: cx - _radius,
				top: cy - _radius,
				right: cx + _radius,
				bottom: cy + _radius
			};

		}

		// THREE POINTS: start, end, and perpendicular with r
		var from = {x:self.from.x, y:self.from.y};
		var to = {x:self.to.x, y:self.to.y};
		var mid = {
			x:(from.x+to.x)/2,
			y:(from.y+to.y)/2
		};

		var perpendicular = a-Math.TAU/4;
		mid.x += Math.cos(perpendicular)*self.arc;
		mid.y += Math.sin(perpendicular)*self.arc;

		// TEST ALL POINTS

		var left = Infinity;
		var top = Infinity;
		var right = -Infinity;
		var bottom = -Infinity;
		var points = [from, to, mid];
		for(var i=0; i<points.length; i++){
			var point = points[i];
			var x = point.x;
			var y = point.y;
			if(left>x) left=x;
			if(top>y) top=y;
			if(right<x) right=x;
			if(bottom<y) bottom=y;
		}

		return {
			left: left,
			top: top,
			right: right,
			bottom: bottom
		};
	};


}