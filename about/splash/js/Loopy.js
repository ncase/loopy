/**********************************

LOOPY!
- with edit & play mode

**********************************/

Loopy.MODE_EDIT = 0;
Loopy.MODE_PLAY = 1;

Loopy.TOOL_INK = 0;
Loopy.TOOL_DRAG = 1;
Loopy.TOOL_ERASE = 2;
Loopy.TOOL_LABEL = 3;

window._offsetX = 225;
window._offsetY = 190;

function Loopy(config){

	var self = this;
	self.config = config;

	// Loopy: EMBED???
	self.embedded = _getParameterByName("embed");
	self.embedded = !!parseInt(self.embedded); // force to Boolean

	// Offset & Scale?!?!
	self.offsetX = 0;
	self.offsetY = 0;
	self.offsetScale = 1;

	// Mouse
	Mouse.init(document.getElementById("canvasses")); // TODO: ugly fix, ew
	
	// Model
	self.model = new Model(self);

	// Loopy: SPEED!
	self.signalSpeed = 1.8;

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
	self.label = new Labeller(self);

	// Play Controls
	self.playbar = new PlayControls(self);
	self.playbar.showPage("Editor"); // start here

	// Modal
	//self.modal = new Modal(self);

	//////////
	// INIT //
	//////////

	self.init = function(){
		self.loadFromURL(); // try it.
	};

	///////////////////
	// UPDATE & DRAW //
	///////////////////

	// Mouse positions!
	window.mousePositions = [];
	var startRecording = false;
	subscribe("key/space",function(){
		startRecording = !startRecording;
		console.log("ahh "+startRecording);
	});

	// REPLAY
	var _mouseIndex = 0;
	var _mouse = [[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,604,0],[303,597,0],[303,574,0],[303,556,0],[303,540,0],[303,524,0],[305,517,0],[305,502,0],[305,487,0],[305,469,0],[305,449,0],[305,430,0],[305,411,0],[304,397,0],[303,385,0],[302,375,0],[301,366,0],[301,362,0],[300,357,0],[299,355,0],[298,353,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,0],[298,352,1],[297,352,1],[287,352,1],[282,352,1],[272,346,1],[263,334,1],[259,324,1],[258,311,1],[260,297,1],[272,278,1],[287,268,1],[303,265,1],[317,265,1],[333,266,1],[343,274,1],[349,289,1],[349,308,1],[347,327,1],[341,342,1],[338,346,1],[330,356,1],[323,360,1],[313,363,1],[304,364,1],[297,364,0],[292,364,0],[292,364,0],[294,362,0],[312,353,0],[349,344,0],[380,343,0],[394,343,0],[397,343,0],[398,343,0],[398,343,0],[399,343,0],[402,343,0],[406,343,0],[407,342,0],[407,342,0],[413,334,0],[415,334,0],[417,334,0],[420,334,0],[420,335,0],[420,337,0],[420,338,0],[420,338,0],[420,338,0],[420,338,1],[420,338,1],[418,338,1],[418-6,338-3,1],[418-12,338-9,1],[418-18,338-18,1],[393,305,1],[393,292,1],[397,275,1],[400,269,1],[408,260,1],[420,255,1],[435,252,1],[450,252,1],[460,256,1],[468,263,1],[473,274,1],[477,289,1],[479,298,1],[480,321,1],[477,327,1],[467,339,1],[456,347,1],[442,351,1],[428,351,1],[415,351,1],[406,346,1],[403,342,0],[403,342,0],[403,341,0],[403,339,0],[403,338,0],[403,337,0],[405,335,0],[408,331,0],[413,323,0],[415,321,0],[415,321,0],[415,321,0],[415,321,0],[413,321,0],[405,318,0],[391,312,0],[378,307,0],[356,298,0],[337,289,0],[322,279,0],[316,274,0],[311,271,0],[308,268,0],[307,268,0],[307,268,0],[306,268,0],[305,268,0],[302,267,0],[300,267,0],[300,267,0],[300,267,0],[300,267,1],[300,267,1],[300,266,1],[302,261,1],[305,253,1],[308,247,1],[313,240,1],[322,234,1],[334,230,1],[341,227,1],[357,227,1],[370,227,1],[384,227,1],[397,231,1],[408,236,1],[415,242,1],[421,253,1],[426,262,1],[428,271,1],[429,275,1],[430,276,0],[430,276,0],[429,275,0],[429,275,0],[429,275,0],[429,275,0],[429,275,0],[429,279,0],[431,294,0],[432,314,0],[432,325,0],[432,329,0],[432,332,0],[432,333,0],[432,333,0],[432,333,0],[432,333,0],[432,333,0],[432,333,0],[432,333,1],[432,336,1],[430,341,1],[425,349,1],[418,355,1],[410,362,1],[403,366,1],[389,369,1],[381,370,1],[358,370,1],[337,365,1],[321,358,1],[310,350,1],[305,343,1],[302,338,1],[299,337,1],[299,336,0],[299,336,0],[299,336,0],[299,336,0],[299,336,0],[299,336,0],[299,335,0],[299,335,0],[299,335,0],[299,335,0],[299,335,0],[299,335,0],[299,335,0],[299,334,0],[301,333,0],[303,332,0],[306,332,0],[312,332,0],[314,333,0],[317,335,0],[319,340,0],[320,346,0],[320,354,0],[319,367,0],[316,380,0],[312,397,0],[310,405,0],[305,425,0],[300,447,0],[299,467,0],[298,490,0],[298,510,0],[298,530,0],[298,552,0],[298,575,0],[301,600,0],[304,620,0],[306,631,0],[311,638,0],[313,644,0],[313,644,0],[313,644,0],[313,644,0],[313,644,0],[313,644,0],[313,644,0],[313,644,0]];

	// Update
	var cursor = document.getElementById("cursor");
	self.update = function(){

		// Record mouse!
		/*if(startRecording){
			window.mousePositions.push([Mouse.x, Mouse.y, Mouse.pressed?1:0]);
		}*/

		// REPLAY MOUSE
		if(_mouseIndex < _mouse.length){
			
			var pos = _mouse[_mouseIndex];
			_mouseIndex++;

			var px = pos[0]-_offsetX;
			var py = pos[1]-_offsetY;
			if(Mouse.x!=px || Mouse.y!=py){
				Mouse.moved = true;
				publish("mousemove");
			}
			var dx = px-Mouse.x;
			var dy = py-Mouse.y;
			var dist = dx*dx+dy*dy;
			if(dist>40*40){
				console.log(_mouseIndex);
				console.log(pos);
			}
			
			Mouse.x = px;
			Mouse.y = py;
			
			var newPressed = !!pos[2];
			if(newPressed && !Mouse.pressed){
				//debugger;
				publish("mousedown");
			}else if(!newPressed && Mouse.pressed){
				publish("mouseup");
			}

			Mouse.pressed = newPressed;

			cursor.style.left = Mouse.x+"px";
			cursor.style.top = Mouse.y+"px";

		}else if(self.mode==Loopy.MODE_EDIT){

			cursor.style.display = "none";

			// DO EET
			self.setMode(Loopy.MODE_PLAY);

			// SEND SIGNAL
			self.model.nodes[0]._HACK_CLICKED();

			// ADD MOUSE EVENTS
			Mouse.makeReal();

		}else{

			Mouse.update();

		}

		//if(!self.modal.isShowing){ // modAl
			self.model.update(); // modEl
		//}
	};
	setInterval(self.update, 1000/30); // 30 FPS, why not.

	// Draw
	self.draw = function(){
		//if(!self.modal.isShowing){ // modAl
			self.model.draw(); // modEl
		//}
		requestAnimationFrame(self.draw);
	};
	requestAnimationFrame(self.draw);

	// TODO: Smarter drawing of Ink, Edges, and Nodes
	// (only Nodes need redrawing often. And only in PLAY mode.)

	//////////////////////
	// PLAY & EDIT MODE //
	//////////////////////

	self.showPlayTutorial = false;
	self.setMode = function(mode){

		self.mode = mode;
		publish("loopy/mode");

		// Play mode!
		if(mode==Loopy.MODE_PLAY){
			//self.showPlayTutorial = true; // show once!
			self.sidebar.showPage("Edit");
			self.playbar.showPage("Player");
			self.sidebar.dom.setAttribute("mode","play");
			self.toolbar.dom.setAttribute("mode","play");
			document.getElementById("canvasses").removeAttribute("cursor"); // TODO: EVENT BASED
		}else{
			publish("model/reset");
		}

		// Edit mode!
		if(mode==Loopy.MODE_EDIT){
			//self.showPlayTutorial = false; // donezo
			self.sidebar.showPage("Edit");
			self.playbar.showPage("Editor");
			self.sidebar.dom.setAttribute("mode","edit");
			self.toolbar.dom.setAttribute("mode","edit");
			document.getElementById("canvasses").setAttribute("cursor", self.toolbar.currentTool); // TODO: EVENT BASED
		}

	};

	/////////////////
	// SAVE & LOAD //
	/////////////////

	self.dirty = false;

	// YOU'RE A DIRTY BOY
	subscribe("model/changed", function(){
		if(!self.embedded) self.dirty = true;
	});

	self.saveToURL = function(embed){

		// Create link
		var dataString = self.model.serialize();
		var uri = dataString; // encodeURIComponent(dataString);
		var base = window.location.origin + window.location.pathname;
		var historyLink = base+"?data="+uri;
		var link;
		if(embed){
			link = base+"?embed=1&data="+uri;
		}else{
			link = historyLink;
		}

		// NO LONGER DIRTY!
		self.dirty = false;

		// PUSH TO HISTORY
		window.history.replaceState(null, null, historyLink);

		return link;

	};

	self.loadFromURL = function(){
		var data = _getParameterByName("data");
		if(data) self.model.deserialize(data);
	}; 


	///////////////////////////
	//////// EMBEDDED? ////////
	///////////////////////////

	self.init();

	if(self.embedded){

		// Hide all that UI
		self.toolbar.dom.style.display = "none";
		self.sidebar.dom.style.display = "none";

		// Fullscreen canvas
		document.getElementById("canvasses").setAttribute("fullscreen","yes");
		self.playbar.dom.setAttribute("fullscreen","yes");
		publish("resize");

		// Center & SCALE The Model
		self.model.center(true);
		subscribe("resize",function(){
			self.model.center(true);
		});

		// Autoplay!
		self.setMode(Loopy.MODE_PLAY);

	}

	// NOT DIRTY, THANKS
	self.dirty = false;

	// SHOW ME, THANKS
	document.body.style.opacity = "";

	// HIDE EVERYTHING THO
	document.getElementById("toolbar").style.display = "none";
	document.getElementById("playbar").style.display = "none";
	document.getElementById("sidebar").style.display = "none";

	// Fullscreen canvas
	document.getElementById("canvasses").setAttribute("fullscreen","yes");
	self.playbar.dom.setAttribute("fullscreen","yes");
	publish("resize");


}