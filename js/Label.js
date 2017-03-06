/**********************************

LABEL!

**********************************/

Label.FONTSIZE = 40;

function Label(model, config){

	var self = this;
	self._CLASS_ = "Label";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	_configureProperties(self, config, {
		x: 0,
		y: 0,
		text: "..."
	});

	// Draw
	var _circleRadius = 0;
	self.draw = function(ctx){

		// Retina
		var x = self.x*2;
		var y = self.y*2;

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target == self){
			var bounds = self.getBounds();
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
		var fontsize = 40;
		ctx.font = "100 "+Label.FONTSIZE+"px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#000";
		ctx.fillText(self.text, 0, 0);

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL LABEL /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Remove from parent!
		model.removeLabel(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.getBounds = function(){
		var ctx = self.model.context;
		var w = (ctx.measureText(self.text).width + 10)*2;
		var h = Label.FONTSIZE;
		return {
			x: self.x-w/2,
			y: self.y-h/2,
			width: w,
			height: h
		};
	};

	self.isPointInLabel = function(x, y){
		return _isPointInBox(x,y, self.getBounds());
	};

}