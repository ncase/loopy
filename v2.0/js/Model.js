/**********************************

MODEL!

**********************************/

function Model(loopy){

	const self = this;
	self.loopy = loopy;

	// Properties
	self.speed = 0.05;

	// Create canvas & context
	const canvas = _createCanvas();
	const ctx = canvas.getContext("2d");
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

		// Model's been changed!
		publish("model/changed");

		// Add Node
		//noinspection all
		const node = new Node(self,config);
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
		for(let i=0; i<self.edges.length; i++){
			const edge = self.edges[i];
			if(edge.to===node || edge.from===node){
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

		// Model's been changed!
		publish("model/changed");

		// Add Edge
		const edge = new Edge(self,config);
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
			return(edge.from===startNode);
		});
	};
	// Get all edges with start node
	self.getEdgesByEndNode = function(endNode){
		return self.edges.filter(function(edge){
			return(edge.to===endNode);
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
		const label = new Label(self,config);
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

	let _canvasDirty = false;

	self.update = function(){

		// Update edges THEN nodes
		for(let i=0;i<self.edges.length;i++) self.edges[i].update(self.speed);
		for(let i=0;i<self.nodes.length;i++) self.nodes[i].update(self.speed);

		// Dirty!
		_canvasDirty = true;

	};

	// SHOULD WE DRAW?
	const drawCountdownFull = 60; // two-second buffer!
	let drawCountdown = drawCountdownFull;
	
	// ONLY IF MOUSE MOVE / CLICK
	subscribe("mousemove", function(){ drawCountdown=drawCountdownFull; });
	subscribe("mousedown", function(){ drawCountdown=drawCountdownFull; });

	// OR INFO CHANGED
	subscribe("model/changed", function(){
		if(self.loopy.mode===Loopy.MODE_EDIT) drawCountdown=drawCountdownFull;
	});

	// OR RESIZE or RESET
	subscribe("resize",function(){ drawCountdown=drawCountdownFull; });
	subscribe("model/reset",function(){ drawCountdown=drawCountdownFull; });
	subscribe("loopy/mode",function(){
		if(loopy.mode===Loopy.MODE_PLAY){
			drawCountdown=drawCountdownFull*2;
		}else{
			drawCountdown=drawCountdownFull;
		}
	});

	self.draw = function(){

		// SHOULD WE DRAW?
		// ONLY IF ARROW-SIGNALS ARE MOVING
		for(let i=0;i<self.edges.length;i++){
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
		const canvasses = document.getElementById("canvasses");
		const CW = canvasses.clientWidth - _PADDING - _PADDING;
		const CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		let tx = loopy.offsetX*2;
		let ty = loopy.offsetY*2;
		tx -= CW+_PADDING;
		ty -= CH+_PADDING;
		const s = loopy.offsetScale;
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
		for(let i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);
		for(let i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(let i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

		// Restore
		ctx.restore();

	};




	//////////////////////////////
	// SERIALIZE & DE-SERIALIZE //
	//////////////////////////////

	self.serialize = function(){

		const data = [];
		// 0 - nodes
		// 1 - edges
		// 2 - labels
		// 3 - globalState (including UID)

		// Nodes
		const nodes = [];
		for(let i=0;i<self.nodes.length;i++){
			const node = self.nodes[i];
			// 0 - id
			// 1 - x
			// 2 - y
			const persist = [
				node.id,
				Math.round(node.x),
				Math.round(node.y),
			];
			injectedPersistProps(persist, node, objTypeToTypeIndex("node"));
			nodes.push(persist);
		}
		data.push(nodes);

		// Edges
		const edges = [];
		for(let i=0;i<self.edges.length;i++){
			const edge = self.edges[i];
			// 0 - from
			// 1 - to
			// 2 - arc
			// 4 - rotation
			const dataEdge = [
				edge.from.id,
				edge.to.id,
				Math.round(edge.arc),
				undefined, // strength
				Math.round(edge.rotation),
			];
			injectedPersistProps(dataEdge, edge, objTypeToTypeIndex("edge"));
			edges.push(dataEdge);
		}
		data.push(edges);

		// Labels
		const labels = [];
		for(let i=0;i<self.labels.length;i++){
			const label = self.labels[i];
			// 0 - x
			// 1 - y
			const persist = [
				Math.round(label.x),
				Math.round(label.y),
			];
			injectedPersistProps(persist, label, objTypeToTypeIndex("label"));
			labels.push(persist);
		}
		data.push(labels);

		// META.
		const persist = [
			Node._UID,
		];
		injectedPersistProps(persist, loopy, objTypeToTypeIndex("loopy"));
		data.push(persist);

		// Return as string!
		let dataString = JSON.stringify(data);
		return stdB64ToUrl(base64EncArr(LZMA.compress(dataString,9).map((v)=>v<0?v+256:v)));
	};

	self.deserialize = function(dataString){
		if(dataString[0]!=='[') dataString = LZMA.decompress(base64DecToArr(urlToStdB64(dataString)).map((v)=>v>128?v-256:v));
		self.clear();

		const data = JSON.parse(dataString);

		// Get from array!
		const nodes = data[0];
		const edges = data[1];
		const labels = data[2];
		const globalState = data[3];

		// Nodes
		for(let i=0;i<nodes.length;i++){
			const node = nodes[i];
			const config = {
				id: node[0],
				x: node[1],
				y: node[2],
			};
			injectedRestoreProps(node,config,objTypeToTypeIndex("node"));
			self.addNode(config);
		}

		// Edges
		for(let i=0;i<edges.length;i++){
			const edge = edges[i];
			const edgeConfig = {
				from: edge[0],
				to: edge[1],
				arc: edge[2],
				rotation: edge[4],
			};
			injectedRestoreProps(edge,edgeConfig,objTypeToTypeIndex("edge"));
			self.addEdge(edgeConfig);
		}

		// Labels
		for(let i=0;i<labels.length;i++){
			const label = labels[i];
			const config = {
				x: label[0],
				y: label[1],
			};
			injectedRestoreProps(label,config,objTypeToTypeIndex("label"));
			self.addLabel(config);
		}

		// META.
		const importArray = typeof globalState === "object"?globalState:[globalState];
		Node._UID = importArray[0];
		injectedRestoreProps(importArray,loopy,objTypeToTypeIndex("loopy"));
	};

	self.clear = function(){

		// Just kill ALL nodes.
		while(self.nodes.length>0){
			self.nodes[0].kill();
		}

		// Just kill ALL labels.
		while(self.labels.length>0){
			self.labels[0].kill();
		}
	};



	////////////////////
	// HELPER METHODS //
	////////////////////

	self.getNodeByPoint = function(x,y,buffer){
		//var result;
		for(let i=self.nodes.length-1; i>=0; i--){ // top-down
			const node = self.nodes[i];
			if(node.isPointInNode(x,y,buffer)) return node;
		}
		return null;
	};

	//self.getEdgeByPoint = function(x, y, wholeArrow){
	self.getEdgeByPoint = function(x, y){
		// TODO: wholeArrow option?
		//var result;
		for(let i=self.edges.length-1; i>=0; i--){ // top-down
			const edge = self.edges[i];
			if(edge.isPointOnLabel(x,y)) return edge;
		}
		return null;
	};

	self.getLabelByPoint = function(x, y){
		//var result;
		for(let i=self.labels.length-1; i>=0; i--){ // top-down
			const label = self.labels[i];
			if(label.isPointInLabel(x,y)) return label;
		}
		return null;
	};

	// Click to edit!
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING (and NOT erase)
		if(self.loopy.mode!==Loopy.MODE_EDIT) return;
		if(self.loopy.tool===Loopy.TOOL_ERASE) return;

		// Did you click on a node? If so, edit THAT node.
		const clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
		if(clickedNode){
			loopy.sidebar.edit(clickedNode);
			return;
		}

		// Did you click on a label? If so, edit THAT label.
		const clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
		if(clickedLabel){
			loopy.sidebar.edit(clickedLabel);
			return;
		}

		// Did you click on an edge label? If so, edit THAT edge.
		const clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
		if(clickedEdge){
			loopy.sidebar.edit(clickedEdge);
			return;
		}

		// If the tool LABEL? If so, TRY TO CREATE LABEL.
		if(self.loopy.tool===Loopy.TOOL_LABEL){
			loopy.label.tryMakingLabel();
			return;
		}

		// Otherwise, go to main Edit page.
		loopy.sidebar.showPage("Edit");

	});

	// Centering & Scaling
	self.getBounds = function(){

		// If no nodes & no labels, forget it.
		if(self.nodes.length===0 && self.labels.length===0) return;

		// Get bounds of ALL objects...
		let left = Infinity;
		let top = Infinity;
		let right = -Infinity;
		let bottom = -Infinity;
		const _testObjects = function(objects){
			for(let i=0; i<objects.length; i++){
				const obj = objects[i];
				const bounds = obj.getBoundingBox();
				if(left>bounds.left) left=bounds.left;
				if(top>bounds.top) top=bounds.top;
				if(right<bounds.right) right=bounds.right;
				if(bottom<bounds.bottom) bottom=bounds.bottom;
			}
		};
		_testObjects(self.nodes);
		_testObjects(self.edges);
		_testObjects(self.labels);

		// Return
		return {
			left:left,
			top:top,
			right:right,
			bottom:bottom
		};

	};
	self.center = function(andScale){

		// If no nodes & no labels, forget it.
		if(self.nodes.length===0 && self.labels.length===0) return;

		// Get bounds of ALL objects...
		const bounds = self.getBounds();
		const left = bounds.left;
		const top = bounds.top;
		const right = bounds.right;
		const bottom = bounds.bottom;

		// Re-center!
		const canvasses = document.getElementById("canvasses");
		const fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
		const fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		const cx = (left+right)/2;
		const cy = (top+bottom)/2;
		loopy.offsetX = (_PADDING+fitWidth)/2 - cx;
		loopy.offsetY = (_PADDING+fitHeight)/2 - cy;

		// SCALE.
		if(andScale){

			const w = right-left;
			const h = bottom-top;

			// Wider or taller than screen?
			const modelRatio = w/h;
			const screenRatio = fitWidth/fitHeight;
			let scaleRatio;
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