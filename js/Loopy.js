/**********************************

LOOPY!
- with edit & play mode

**********************************/

function Loopy(config){

	var self = this;
	self.config = config;

	// Mouse
	Mouse.init(document.getElementById("canvasses")); // TODO: ugly fix, ew
	
	// Canvasses: Model & Ink	
	self.model = new Model(self);
	self.ink = new Ink(self);

	// Sidebar
	self.sidebar = new Sidebar();

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

	// TODO: Smarter drawing of Ink, Edges, and Nodes
	// (only Nodes need redrawing often. And only in PLAY mode.)

}
