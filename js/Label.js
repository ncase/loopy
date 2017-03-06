/**********************************

LABEL!

**********************************/

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

		// Translate!
		ctx.save();
		ctx.translate(x,y);

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target == self){
			// TODO.
		}

		// Text!
		var fontsize = 40;
		ctx.font = "100 "+fontsize+"px sans-serif";
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
	};

}