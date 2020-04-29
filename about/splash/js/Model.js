/**********************************

MODEL!

**********************************/

function Model(loopy){

	var self = this;
	self.loopy = loopy;

	// Properties
	self.speed = 0.02;

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

	// SPLASH -- 
	var nodeConfigs = [
		{x:300-_offsetX, y:300-_offsetY, r:60, init:0.83, label:" "},
		{x:435-_offsetX, y:300-_offsetY, r:60, hue:4, init:0.83, label:" "},
	];

	// Remove Node
	self.addNode = function(){

		// Model's been changed!
		publish("model/changed");

		var config = nodeConfigs.shift();

		// Add Node
		var node = new Node(self,config);
		self.nodeByID[node.id] = node;
		self.nodes.push(node);
		self.update();
		return node;

	};

	// Remove Node
	self.removeNode = function(node){

		// Model's been changed!
		publish("model/changed");

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

	var edgeConfigs = [
		{from:1, to:2, arc:75},
		{from:2, to:1, arc:75, strength:-1},
	];

	// Remove edge
	self.addEdge = function(){

		// Model's been changed!
		publish("model/changed");

		var config = edgeConfigs.shift();

		// Add Edge
		var edge = new Edge(self,config);
		self.edges.push(edge);
		self.update();
		return edge;
	};

	// Remove edge
	self.removeEdge = function(edge){

		// Model's been changed!
		publish("model/changed");

		// Remove edge
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

		// Model's been changed!
		publish("model/changed");

		// Add label
		var label = new Label(self,config);
		self.labels.push(label);
		self.update();
		return label;
	};

	// Remove label
	self.removeLabel = function(label){

		// Model's been changed!
		publish("model/changed");

		// Remove label
		self.labels.splice(self.labels.indexOf(label),1);
		
	};



	///////////////////
	// UPDATE & DRAW //
	///////////////////

	var _canvasDirty = false;

	self.update = function(){

		// Update edges THEN nodes
		for(var i=0;i<self.edges.length;i++) self.edges[i].update(self.speed);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].update(self.speed);

		// Dirty!
		_canvasDirty = true;

	};

	// SHOULD WE DRAW?
	var drawCountdownFull = 60; // two-second buffer!
	var drawCountdown = drawCountdownFull; 
	
	// ONLY IF MOUSE MOVE / CLICK
	subscribe("mousemove", function(){ drawCountdown=drawCountdownFull; });
	subscribe("mousedown", function(){ drawCountdown=drawCountdownFull; });

	// OR INFO CHANGED
	subscribe("model/changed", function(){
		if(self.loopy.mode==Loopy.MODE_EDIT) drawCountdown=drawCountdownFull;
	});

	// OR RESIZE or RESET
	subscribe("resize",function(){ drawCountdown=drawCountdownFull; });
	subscribe("model/reset",function(){ drawCountdown=drawCountdownFull; });
	subscribe("loopy/mode",function(){ drawCountdown=drawCountdownFull; });

	self.draw = function(){

		// SHOULD WE DRAW?
		// ONLY IF ARROW-SIGNALS ARE MOVING
		for(var i=0;i<self.edges.length;i++){
			if(self.edges[i].signals.length>0){
				drawCountdown = drawCountdownFull;
				break;
			}
		}

		// DRAW???????
		drawCountdown--;
		if(drawCountdown<=0) return;

		// Also only draw if last updated...
		if(!_canvasDirty) return;
		_canvasDirty = false;

		// Clear!
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

		// Translate
		ctx.save();

		// Translate to center, (translate, scale, translate) to expand to size
		var canvasses = document.getElementById("canvasses");
		var CW = canvasses.clientWidth - _PADDING - _PADDING;
		var CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		var tx = loopy.offsetX*2;
		var ty = loopy.offsetY*2;
		tx -= CW+_PADDING;
		ty -= CH+_PADDING;
		var s = loopy.offsetScale;
		tx = s*tx;
		ty = s*ty;
		tx += CW+_PADDING;
		ty += CH+_PADDING;
		if(loopy.embedded){
			tx += _PADDING; // dunno why but this is needed
			ty += _PADDING; // dunno why but this is needed
		}
		ctx.setTransform(s, 0, 0, s, tx, ty);

		// Draw labels THEN edges THEN nodes
		for(var i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);
		for(var i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(var i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

		// Restore
		ctx.restore();

	};




	//////////////////////////////
	// SERIALIZE & DE-SERIALIZE //
	//////////////////////////////

	self.serialize = function(){

		var data = {};

		// Nodes
		data.n = [];
		for(var i=0;i<self.nodes.length;i++){
			var node = self.nodes[i];
			data.n.push({
				id: node.id,
				x: Math.round(node.x),
				y: Math.round(node.y),
				i: node.init,
				l: encodeURIComponent(encodeURIComponent(node.label)),
				h: node.hue,
				r: node.radius
			});
		}

		// Edges
		data.e = [];
		for(var i=0;i<self.edges.length;i++){
			var edge = self.edges[i];
			var dataEdge = {
				f: edge.from.id,
				t: edge.to.id,
				a: Math.round(edge.arc),
				s: edge.strength
			};
			if(dataEdge.f==dataEdge.t){
				dataEdge.r = Math.round(edge.rotation);
			}
			data.e.push(dataEdge);
		}

		// Labels
		data.l = [];
		for(var i=0;i<self.labels.length;i++){
			var label = self.labels[i];
			data.l.push({
				x: Math.round(label.x),
				y: Math.round(label.y),
				t: encodeURIComponent(encodeURIComponent(label.text))
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
		for(var i=0;i<data.n.length;i++){
			var node = data.n[i];
			self.addNode({
				id: node.id,
				x: node.x,
				y: node.y,
				init: node.i,
				label: decodeURIComponent(node.l),
				hue: node.h,
				radius: node.r
			});
		}

		// Edges
		for(var i=0;i<data.e.length;i++){
			var edge = data.e[i];
			self.addEdge({
				from: edge.f,
				to: edge.t,
				arc: edge.a,
				rotation: edge.r,
				strength: edge.s
			});
		}

		// Labels
		for(var i=0;i<data.l.length;i++){
			var label = data.l[i];
			self.addLabel({
				x: label.x,
				y: label.y,
				text: decodeURIComponent(label.t)
			});
		}

		// META.
		Node._UID = data.UID;

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
		var result;
		for(var i=self.labels.length-1; i>=0; i--){ // top-down
			var label = self.labels[i];
			if(label.isPointInLabel(x,y)) return label;
		}
		return null;
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

		// Did you click on a label? If so, edit THAT label.
		var clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
		if(clickedLabel){
			loopy.sidebar.edit(clickedLabel);
			return;
		}

		// Did you click on an edge label? If so, edit THAT edge.
		var clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
		if(clickedEdge){
			loopy.sidebar.edit(clickedEdge);
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

	// Centering & Scaling
	self.center = function(andScale){

		// If no nodes & no labels, forget it.
		if(self.nodes.length==0 && self.labels.length==0) return;

		// Get bounds of ALL objects...
		var left = Infinity;
		var top = Infinity;
		var right = -Infinity;
		var bottom = -Infinity;
		var _testObjects = function(objects){
			for(var i=0; i<objects.length; i++){
				var obj = objects[i];
				var bounds = obj.getBoundingBox();
				if(left>bounds.left) left=bounds.left;
				if(top>bounds.top) top=bounds.top;
				if(right<bounds.right) right=bounds.right;
				if(bottom<bounds.bottom) bottom=bounds.bottom;
			}
		};
		_testObjects(self.nodes);
		_testObjects(self.edges);
		_testObjects(self.labels);

		// Re-center!
		var canvasses = document.getElementById("canvasses");
		var fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
		var fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		var cx = (left+right)/2;
		var cy = (top+bottom)/2;
		loopy.offsetX = (_PADDING+fitWidth)/2 - cx;
		loopy.offsetY = (_PADDING+fitHeight)/2 - cy;

		// SCALE.
		if(andScale){

			var w = right-left;
			var h = bottom-top;

			// Wider or taller than screen?
			var modelRatio = w/h;
			var screenRatio = fitWidth/fitHeight;
			var scaleRatio;
			if(modelRatio > screenRatio){
				// wider...
				scaleRatio = fitWidth/w;
			}else{
				// taller...
				scaleRatio = fitHeight/h;
			}

			// Loopy, then!
			loopy.offsetScale = scaleRatio;

		}

	};

}