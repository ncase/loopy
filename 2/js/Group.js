/**********************************

GROUP!

**********************************/
Group.COLORS = {
	"-1":"#000000", // black
	0: "#880000", // red
	1: "#885533", // orange
	2: "#888800", // yellow
	3: "#558800", // green
	4: "#446688", // blue
	5: "#664488", // purple
};
Group.FONTSIZE = 40;
Group._CLASS_ = "Group";

function Group(model, config){

	const self = this;
	self._CLASS_ = "Group";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	const defaultProperties = {
		x: 0,
			y: 0,
	};
	injectedDefaultProps(defaultProperties,objTypeToTypeIndex("Group"));
	_configureProperties(self, config, defaultProperties);

	// Draw
	self.draw = function(ctx){

		if(self.visibility===1 && self.loopy.mode===Loopy.MODE_PLAY) return;
		// Retina
		const x = self.x*2;
		const y = self.y*2;

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target === self){
			const bounds = self.getBounds();
			ctx.save();
			ctx.scale(2,2); // RETINA
			ctx.beginPath();
			ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
			ctx.fillStyle = HIGHLIGHT_COLOR;
			ctx.fill();
			ctx.restore();
		}

		// Translate!
		ctx.save();
		ctx.translate(x,y);

		// Text!
		ctx.font = "100 "+Group.FONTSIZE+"px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = Group.COLORS[self.textColor];

		// ugh new lines are a PAIN.
		const lines = self.breakText();
		ctx.translate(0, -(Group.FONTSIZE*lines.length)/2);
		for(let i=0; i<lines.length; i++){
			const line = lines[i];
			ctx.fillText(line, 0, 0);
			ctx.translate(0, Group.FONTSIZE);
		}

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL Group /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Remove from parent!
		model.removeGroup(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.breakText = function(){
		return self.text.split(/\n/);
	};

	self.getBounds = function(){

		const ctx = self.model.context;

		// Get MAX width...
		const lines = self.breakText();
		let maxWidth = 0;
		for(let i=0; i<lines.length; i++){
			const line = lines[i];
			const w = (ctx.measureText(line).width + 10)*2;
			if(maxWidth<w) maxWidth=w;
		}

		// Dimensions, then:
		const w = maxWidth;
		const h = (Group.FONTSIZE*lines.length)/2;

		// Bounds, then:
		return {
			x: self.x-w/2,
			y: self.y-h/2-Group.FONTSIZE/2,
			width: w,
			height: h+Group.FONTSIZE/2
		};

	};

	self.isPointInGroup = function(x, y){
		return _isPointInBox(x,y, self.getBounds());
	};

	self.getBoundingBox = function(){
		const bounds = self.getBounds();
		return {
			left: bounds.x,
			top: bounds.y,
			right: bounds.x + bounds.width,
			bottom: bounds.y + bounds.height
		};
	};

}