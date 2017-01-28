/**********************************

MODEL!

**********************************/

function Model(loopy){

	var self = this;
	self.loopy = loopy;

	// Properties
	self.speed = 0.05;

	// Create canvas & context
	var canvas = _createCanvas();
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;



	///////////////////
	// NODES //////////
	///////////////////

	// Nodes
	self.nodes = [];
	self.nodeByID = {};
	self.getNode = function(id){
		return self.nodeByID[id];
	};

	// Remove Node
	self.addNode = function(config){
		var node = new Node(self,config);
		self.nodeByID[node.id] = node;
		self.nodes.push(node);
		return node;
	};

	// Remove Node
	self.removeNode = function(node){

		// Remove from array
		self.nodes.splice(self.nodes.indexOf(node),1);

		// Remove from object
		delete self.nodeByID[node.id];

		// Remove all associated TO and FROM edges
		for(var i=0; i<self.edges.length; i++){
			var edge = self.edges[i];
			if(edge.to==node || edge.from==node){
				edge.kill();
				i--; // move index back, coz it's been killed
			}
		}
		
	};


	///////////////////
	// EDGES //////////
	///////////////////

	// Edges
	self.edges = [];

	// Remove edge
	self.addEdge = function(config){
		var edge = new Edge(self,config);
		self.edges.push(edge);
		return edge;
	};

	// Remove edge
	self.removeEdge = function(edge){
		self.edges.splice(self.edges.indexOf(edge),1);
	};



	///////////////////
	// UPDATE & DRAW //
	///////////////////

	self.update = function(){

		// Update edges THEN nodes
		for(var i=0;i<self.edges.length;i++) self.edges[i].update(self.speed);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].update(self.speed);

	};

	self.draw = function(){

		// Clear!
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

		// Draw edges THEN nodes
		for(var i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

	};



	////////////////////
	// HELPER METHODS //
	////////////////////

	self.getNodeByPoint = function(x,y,buffer){
		var result;
		for(var i=self.nodes.length-1; i>=0; i--){ // top-down
			var node = self.nodes[i];
			if(node.isPointInNode(x,y,buffer)) return node;
		}
		return null;
	};

	// Click to edit!
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING w INK
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;

		// Did you click on a node? If so, edit THAT node.
		// TODO: CLICK TO EDIT EDGE TOO
		var clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
		if(clickedNode){
			loopy.sidebar.edit(clickedNode);
			return;
		}

		// Otherwise, go to main Edit page.
		loopy.sidebar.showPage("Edit");

	});

}