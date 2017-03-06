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
		self.update();
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
		self.update();
		return edge;
	};

	// Remove edge
	self.removeEdge = function(edge){
		self.edges.splice(self.edges.indexOf(edge),1);
	};

	// Get all edges with start node
	self.getEdgesByStartNode = function(startNode){
		return self.edges.filter(function(edge){
			return(edge.from==startNode);
		});
	};




	///////////////////
	// LABELS /////////
	///////////////////

	// Labels
	self.labels = [];

	// Remove label
	self.addLabel = function(config){
		var label = new Label(self,config);
		self.labels.push(label);
		self.update();
		return label;
	};

	// Remove label
	self.removeLabel = function(label){
		self.labels.splice(self.labels.indexOf(label),1);
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

		// Draw labels THEN edges THEN nodes
		for(var i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);
		for(var i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

	};




	//////////////////////////////
	// SERIALIZE & DE-SERIALIZE //
	//////////////////////////////

	self.serialize = function(){

		var data = {};

		// Nodes
		data.nodes = [];
		for(var i=0;i<self.nodes.length;i++){
			var node = self.nodes[i];
			data.nodes.push({
				id: node.id,
				x: Math.round(node.x),
				y: Math.round(node.y),
				init: node.init,
				label: node.label,
				hue: node.hue,
				radius: node.radius
			});
		}

		// Edges
		data.edges = [];
		for(var i=0;i<self.edges.length;i++){
			var edge = self.edges[i];
			data.edges.push({
				from: edge.from.id,
				to: edge.to.id,
				arc: Math.round(edge.arc),
				rotation: Math.round(edge.rotation),
				strength: edge.strength
			});
		}

		// META.
		data.UID = Node._UID;

		// Return as string!
		var dataString = JSON.stringify(data);
		return dataString;

	};

	self.deserialize = function(dataString){

		self.clear();

		var data = JSON.parse(dataString);

		// Nodes
		for(var i=0;i<data.nodes.length;i++){
			var node = data.nodes[i];
			self.addNode({
				id: node.id,
				x: node.x,
				y: node.y,
				init: node.init,
				label: node.label,
				hue: node.hue,
				radius: node.radius
			});
		}

		// Edges
		for(var i=0;i<data.edges.length;i++){
			var edge = data.edges[i];
			self.addEdge({
				from: edge.from,
				to: edge.to,
				arc: edge.arc,
				rotation: edge.rotation,
				strength: edge.strength
			});
		}

		// META.
		Node._UID = data.UID;

		// TODO: META - center X & Y, so can offset later!
		// TODO: META - versioning so whatever don't screw up

	};

	self.clear = function(){

		// Just kill ALL nodes.
		while(self.nodes.length>0){
			self.nodes[0].kill();
		}

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

	self.getEdgeByPoint = function(x, y, wholeArrow){
		// TODO: wholeArrow option?
		var result;
		for(var i=self.edges.length-1; i>=0; i--){ // top-down
			var edge = self.edges[i];
			if(edge.isPointOnLabel(x,y)) return edge;
		}
		return null;
	};

	self.getLabelByPoint = function(x, y){
		// TODO: IMPLEMENT "GET LABEL BY POINT"
	};

	// Click to edit!
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING (and NOT erase)
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool==Loopy.TOOL_ERASE) return;

		// Did you click on a node? If so, edit THAT node.
		var clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
		if(clickedNode){
			loopy.sidebar.edit(clickedNode);
			return;
		}

		// Did you click on an edge label? If so, edit THAT edge.
		var clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
		if(clickedEdge){
			loopy.sidebar.edit(clickedEdge);
			return;
		}

		// Did you click on a label? If so, edit THAT label.
		var clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
		if(clickedLabel){
			loopy.sidebar.edit(clickedLabel);
			return;
		}

		// If the tool LABEL? If so, TRY TO CREATE LABEL.
		if(self.loopy.tool==Loopy.TOOL_LABEL){
			loopy.label.tryMakingLabel();
			return;
		}

		// Otherwise, go to main Edit page.
		loopy.sidebar.showPage("Edit");

	});

}