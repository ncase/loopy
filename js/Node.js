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

	// Update!
	self.update = function(speed){

		// Synchronous update
		self.value = self.nextValue;

		// Keep value within bounds!
		if(self.value<-100) self.value=-100;
		if(self.value>100) self.value=100;
		// if(Math.abs(self.value)<0.1) self.value=0;

		// Synchronous update
		self.nextValue = self.value;

	};

	// Draw
	self.draw = function(ctx){

		// Retina
		var x = self.x*2;
		var y = self.y*2;
		var r = model.meta.radius*2;

		// Translate!
		ctx.save();
		ctx.translate(x,y);
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
		if(self.value>=0){
			ctx.fillStyle = "#fff"; // if positive, WHITE
		}else{
			ctx.fillStyle = color; // if negative, OUTLINE
		}
		ctx.fillText(config.label, 0, 0);

		// Restore
		ctx.restore();

	};

}