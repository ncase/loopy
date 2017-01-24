/**********************************

LOOPY!
- with edit & play mode

**********************************/

function Loopy(config){

	var self = this;

	// Mouse
	Mouse.init(window);
	
	// LAYERS: Model & Ink	
	self.model = new Model(self);
	self.ink = new Ink(self);

	///////////////////
	// UPDATE & DRAW //
	///////////////////

	// Update
	self.update = function(){
	};
	setInterval(self.update, 1000/30); // 30 FPS, why not.

	// Draw
	self.draw = function(){
		self.model.draw();
		requestAnimationFrame(self.draw);
	};
	requestAnimationFrame(self.draw);

}
