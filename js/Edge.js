/**********************************

EDGE!

**********************************/

function Edge(model, config){

	var self = this;
	self.model = model;
	self.config = config;

	// Properties
	self.x = config.x;
	self.y = config.y;
	self.strength = config.strength;

	// Get my NODES
	self.from = model.getNode(config.from);
	self.to = model.getNode(config.to);

	// My label???
	var s = self.strength;
	var l;
	if(s>=1) l="+++";
	else if(s>=0.5) l="++";
	else if(s>=0) l="+";
	else if(s==0) l="0";
	else if(s>-0.5) l="-";
	else if(s>-1) l="- -";
	else l="- - -";
	self.label = l;

	// Update!
	self.update = function(speed){

		// Change TO with FROM x strength (x model's speed)
		self.to.nextValue += self.from.value * self.strength * speed;

	};

	// Draw
	self.draw = function(ctx){

		// Width & Color
		var color = "hsl(0,0%,40%)";
		ctx.lineWidth = 8*Math.abs(self.strength)+2;
		ctx.strokeStyle = color;

		// Mathy calculations:
		var fx=self.from.x*2,
			fy=self.from.y*2,
			tx=self.to.x*2,
			ty=self.to.y*2;			
		var dx = tx-fx;
		var dy = ty-fy;
		var w = Math.sqrt(dx*dx+dy*dy);
		var a = Math.atan2(dy,dx);
		var h = Math.abs(config.arc*2);

		// From: http://www.mathopenref.com/arcradius.html
		var r = (h/2) + ((w*w)/(8*h));
		var y = r-h; // the circle's y-pos is radius - given height.
		var a2 = Math.acos((w/2)/r); // angle from x axis, arc-cosine of half-width & radius

		// Translate & Rotate!
		ctx.save();
		ctx.translate(fx, fy);
		ctx.rotate(a);

		// Arrow buffer...
		var arrowBuffer = 20; // hack!
		var arrowDistance = (model.meta.radius+arrowBuffer)*2;
		var arrowAngle = arrowDistance/r; // (distance/circumference)*TAU, close enough.

		// Arc it!
		var startAngle = a2 - Math.TAU/2;
		var endAngle = -a2;
		if(h>r){
			startAngle *= -1;
			endAngle *= -1;
		}
		ctx.beginPath();
		var y2, end;
		if(config.arc>0){
			y2 = y;
			end = endAngle-arrowAngle;
			ctx.arc(w/2, y2, r, startAngle, end, false);
		}else{
			y2 = -y;
			end = -endAngle+arrowAngle;
			ctx.arc(w/2, y2, r, -startAngle, end, true);
		}

		// Arrow HEAD!
		var arrowLength = 10*2;
		var ax = w/2 + Math.cos(end)*r;
		var ay = y2 + Math.sin(end)*r;
		var aa = end + Math.TAU/4;
		ctx.save();
		ctx.translate(ax, ay);
		if(config.arc<0) ctx.scale(-1,-1);
		ctx.rotate(aa);
		ctx.moveTo(-arrowLength, -arrowLength);
		ctx.lineTo(0,0);
		ctx.lineTo(-arrowLength, arrowLength);
		ctx.restore();

		// Stroke!
		ctx.stroke();

		// LABEL!
		var labelBuffer = 20*2;
		ctx.font = "300 40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		var lx = w/2;
		var ly = h-labelBuffer;
		ctx.save();
		ctx.translate(lx, ly);
		//ctx.rotate(-a);
		ctx.fillText(self.label, 0, 0);
		ctx.restore();

		// Restore
		ctx.restore();

	};

}