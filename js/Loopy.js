/**********************************

LOOPY!
- create an interactive model of nodes & edges
- by reading & writing a JSON object

TODO:
- two different canvasses for nodes & edges? so it's more efficient

**********************************/

function Loopy(config){

	var self = this;
	self.config = config;

	// Meta
	self.meta = config.meta || {};
	self.meta.radius = self.meta.radius || 50;
	self.meta.speed = self.meta.speed || 1;

	// Canvas
	var width = config.width;
	var height = config.height;
	self.canvas = document.createElement("canvas");
	self.canvas.width = width*2; // retina
	self.canvas.style.width = width+"px";
	self.canvas.height = height*2; // retina
	self.canvas.style.height = height+"px";
	self.context = self.canvas.getContext("2d");
	self.canvas.setAttribute("class","loopy-model");

	// Mouse!
	Mouse.init(self.canvas);

	// Nodes
	self.nodeByID = {};
	self.getNode = function(id){
		return self.nodeByID[id];
	};
	self.nodes = [];
	for(var i=0;i<config.nodes.length;i++){
		var node = new Node(self, config.nodes[i]);
		self.nodeByID[node.id] = node;
		self.nodes.push(node);
	}

	// Edges
	self.edges = [];
	for(var i=0;i<config.edges.length;i++){
		var edge = new Edge(self, config.edges[i]);
		self.edges.push(edge);
	}

	// Update
	self.update = function(){

		Mouse.update();

		var speed = self.meta.speed;

		// Update edges THEN nodes.
		for(var i=0;i<self.edges.length;i++) self.edges[i].update(speed);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].update(speed);		

		// Update drawing!
		self._updatedSinceLastDrawn = true;

	};
	setInterval(self.update, 1000/30); // 30 FPS, why not.

	// Draw
	self._updatedSinceLastDrawn = true;
	self.draw = function(){

		// Only re-draw if updated since last time.
		if(self._updatedSinceLastDrawn){
			self._updatedSinceLastDrawn = false;

			// Clear!
			var ctx = self.context;
			ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

			// Draw edges, then nodes
			for(var i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
			for(var i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

		}

		// RAF
  		requestAnimationFrame(self.draw);

	};
	requestAnimationFrame(self.draw);

}