/**********************************

LOOPY!
- with edit & play mode

**********************************/

Loopy.MODE_EDIT = 0;
Loopy.MODE_PLAY = 1;

Loopy.TOOL_INK = 0;
Loopy.TOOL_DRAG = 1;
Loopy.TOOL_ERASE = 2;

function Loopy(config){

	var self = this;
	self.config = config;

	// Mouse
	Mouse.init(document.getElementById("canvasses")); // TODO: ugly fix, ew
	
	// Model
	self.model = new Model(self);

	// Sidebar
	self.sidebar = new Sidebar(self);
	self.sidebar.showPage("Edit"); // start here

	// Play/Edit mode
	self.mode = Loopy.MODE_EDIT;

	// Tools
	self.toolbar = new Toolbar(self);
	self.tool = Loopy.TOOL_INK;
	self.ink = new Ink(self);
	self.drag = new Dragger(self);
	self.erase = new Eraser(self);

	///////////////////
	// UPDATE & DRAW //
	///////////////////

	// Update
	self.update = function(){
		Mouse.update();
		self.model.update();
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

	//////////////////////
	// PLAY & EDIT MODE //
	//////////////////////

	self.setMode = function(mode){

		self.mode = mode;

		// Play mode!
		if(mode==Loopy.MODE_PLAY){
			self.sidebar.showPage("Play");
			self.sidebar.dom.setAttribute("mode","play");
		}

		// Edit mode!
		if(mode==Loopy.MODE_EDIT){
			self.sidebar.showPage("Edit");
			self.sidebar.dom.setAttribute("mode","edit");
		}

	};

}