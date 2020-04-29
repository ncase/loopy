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
	self.getNode = function(id){
		return self.nodes[id];
	};

	// Remove LoopyNode
	self.addNode = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add LoopyNode
		const node = new LoopyNode(self,config);
		self.nodes.push(node);
		if(!node.id || node.id !== self.nodes.length-1) node.id = self.nodes.length-1;
		applyInitialPropEffects(node);
		self.update();
		return node;

	};

	// Remove LoopyNode
	self.removeNode = function(node){

		// Model's been changed!
		publish("model/changed");

		// Remove from array
		self.nodes.splice(self.nodes.indexOf(node),1);
		self.nodes.forEach((n,i)=>n.id = i);

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
		applyInitialPropEffects(edge);
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
		applyInitialPropEffects(label);
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
	// GROUPS /////////
	///////////////////

	// Groups
	self.groups = [];

	// Remove label
	self.addGroup = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add label
		const group = new Group(self,config);
		self.groups.push(group);
		applyInitialPropEffects(group);
		self.update();
		return group;
	};

	// Remove group
	self.removeGroup = function(group){

		// Model's been changed!
		publish("model/changed");

		// Remove label
		self.groups.splice(self.groups.indexOf(group),1);

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
	const drawCountdownFull = 7*60; // two-second buffer!
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

		if(self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===0){
			self.smoothCameraMove(self.getBounds()); // 0.1
		}
		if(self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===1){
			const bounds = self.getSignalsBounds();
			if(bounds.strict.weight>0) {
				bounds.large.cx = bounds.strict.cx;
				bounds.large.cy = bounds.strict.cy;
				bounds.large.weight = bounds.strict.weight;
				delete bounds.strict.cx;
				delete bounds.strict.cy;
				delete bounds.strict.weight;
				self.smoothCameraMove(bounds.large,bounds.strict); // 0.1
			}
			else self.smoothCameraMove(self.getBounds()); //0.02
		}

		// Clear!
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

		// Translate
		ctx.save();
		applyZoomTransform(ctx);

		// Draw labels THEN edges THEN nodes
		for(let i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);
		for(let i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(let i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);

		// Restore
		ctx.restore();

	};



	//////////////////
	// import Model //
	//////////////////


	self.importModel = (newModel)=>{
		self.clear();
		for(let key in newModel.globals)loopy[key] = newModel.globals[key];
		if(loopy.embed) loopy.embedded = 1;
		applyInitialPropEffects(loopy);
		// refresh sidebar
		const globalEditPage = loopy.sidebar.pages[3];
		injectPropsLabelInSideBar(globalEditPage,objTypeToTypeIndex("loopy"));

		// import entities data.
		newModel.nodes.forEach((n)=>self.addNode(n));
		newModel.edges.forEach((n)=>self.addEdge(n));
		newModel.labels.forEach((n)=>self.addLabel(n));
		//newModel.groups.forEach((n,i)=>self.addGroup(n));
		setTimeout(()=>{
			const need = self.getBounds();
			const available = document.getElementById("canvasses");
			if(need.left<0 || need.top<0 || need.right>available.clientWidth || need.bottom>available.clientHeight) self.center(true);
			else self.center(false);
		},0); // do it when loopy is fully load, else it's sheety
	}

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
	subscribe("mousewheel",function(mouse){
		// ONLY WHEN EDITING (or MODE_PLAY in freeCam)
		if(self.loopy.mode===Loopy.MODE_EDIT || (self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===2)){
			const oldOffsetScale = loopy.offsetScale;
			if(mouse.wheel<0) loopy.offsetScale*=1.1;
			if(mouse.wheel>0) loopy.offsetScale*=0.9;
			const old_m2M = mouseToMouse(mouse.x,mouse.y,oldOffsetScale,loopy.offsetX,loopy.offsetY);
			const new_m2M = mouseToMouse(mouse.x,mouse.y,loopy.offsetScale,loopy.offsetX,loopy.offsetY);
			loopy.offsetX +=  (new_m2M.x - old_m2M.x);
			loopy.offsetY +=  (new_m2M.y - old_m2M.y);
		}
	});
	// Centering & Scaling
	self.getSignalsBounds = function(includeInstant=true){
		let strictBounds = {};
		let largeBounds = {};
		for(let i=0; i<self.nodes.length; i++){
			const node = self.nodes[i];
			if(node.hidden===true) continue;
			if(!node.aggregate) continue;
			largeBounds = mergeBounds(largeBounds,node.getBoundingBox()); // signal in aggregator
			strictBounds = mergeBounds(strictBounds,node.getBoundingBox()); // signal in aggregator
		} //TODO: handle instant/lightning edges
		for(let i=0; i<self.edges.length; i++){
			const edge = self.edges[i];
			if(edge.hidden===true) continue;
			if(edge.signals.length === 0) continue;
			largeBounds = mergeBounds(largeBounds,edge.getBoundingBox(), edge.from.getBoundingBox(), edge.to.getBoundingBox());
			edge.signals.forEach((s)=>strictBounds = mergeBounds(strictBounds,edge.getSignalBoundingBox(s)));
		}
		return {strict:strictBounds,large:largeBounds};
	};
	// Centering & Scaling
	self.getBounds = function(visible=true){
		// If no nodes & no labels, forget it.
		if(self.nodes.length===0 && self.labels.length===0) return;

		let bounds = {};
		// Get bounds of ALL objects...
		const _testObjects = function(objects){
			for(let i=0; i<objects.length; i++){
				const obj = objects[i];
				if(obj.hide===true) continue;
				bounds = mergeBounds(bounds,obj.getBoundingBox());
			}
		};
		_testObjects(self.nodes);
		_testObjects(self.edges);
		_testObjects(self.labels);
		return bounds;
	};
	self.fitBounds = function(size){
		const bounds = self.getBounds();
		let addX = 0;
		let addY = 0;
		let ratio = 1;
		if(bounds.left<0) addX -= bounds.left;
		if(bounds.top<0) addY -= bounds.top;
		if(bounds.right>size || bounds.right-bounds.left>size){
			addX -= bounds.left;
			ratio = Math.min(ratio,size/(bounds.right-bounds.left));
		}
		if(bounds.bottom>size || bounds.bottom-bounds.top>size){
			addY -= bounds.top;
			ratio = Math.min(ratio,size/(bounds.bottom-bounds.top));
		}
		self.nodes.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
		self.labels.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
		//self.groups.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
	};
	function offsetToBounds(offset,fitBounds){
		const calc = (side,oppositeSide,offset,scale)=>{
			const c = (fitBounds[side]+fitBounds[oppositeSide])/2;
			const sideDelta = fitBounds[side]-c;
			return sideDelta/scale+c-offset-_PADDING/2;
		}
		return {
			left: calc("left","right",offset.offsetX,offset.offsetScale),
			right: calc("right","left",offset.offsetX,offset.offsetScale),
			top: calc("top","bottom",offset.offsetY,offset.offsetScale),
			bottom: calc("bottom","top",offset.offsetY,offset.offsetScale),
		}
	}

	self.smoothCameraMove = function(targetBounds,mustKeepInRangeBounds={},speedSetting = new SpeedSettings(),extraPadding=0){
		const old = {offsetScale:loopy.offsetScale, offsetX:loopy.offsetX,offsetY:loopy.offsetY};
		if(!self.olderOffset) self.olderOffset = old;
		const fitBounds = fitToBounds();
		/**
		 * on tente de centrer sur le cx/cy du target
		 * si le targetbounds n'est pas entièrement inclu dans ce cadrage, on ajoute ce qui manque en maintenant le centre.
		 * Avec ça, on a notre cadrage idéal au quel on applique le ratio de vitesse.
		 *
		 * avec le cadrage pondéré vitesse, on regarde s'il y a un centre strict.
		 * Si oui, on recentre et on étend au cadrage strict à partir de l'actuel, en maintenant le centre.
		 * Si non, on étend au cadrage strict si nécessaire
		 * //NOP enfin, on élargie le cadrage d'extraPadding (en % si entre 0 et 1, en absolu si >1)
		 *
		 * C'est bon, adjugé !
		 */

		let targetOffset;
		if(targetBounds.weight) targetOffset = scaleTo(targetBounds,fitBounds,true);
		else targetOffset = scaleTo(targetBounds,fitBounds);

		const calcDelta = (offsetType,speedType)=>{
			let oldDelta = old[offsetType]-self.olderOffset[offsetType];
			const fullDelta = targetOffset[offsetType]-old[offsetType];
			if(offsetType=== "offsetScale" && Math.abs(fullDelta)<0.001) return 0;
			if(offsetType=== "offsetScale" && Math.abs(oldDelta)<0.001) oldDelta = fullDelta>0?0.001:-0.001;
			const idealDelta = fullDelta*speedType.speedMaxPercent;
			let delta = idealDelta;
			delta = oldDelta*speedType.inertia + delta*(1-speedType.inertia);
			if(oldDelta>0){
				if(oldDelta+oldDelta*speedType.accelerationMax<delta) delta = oldDelta+oldDelta*speedType.accelerationMax;
				if(oldDelta-oldDelta*speedType.accelerationMax>delta) delta = oldDelta-oldDelta*speedType.accelerationMax;
			} else {
				if(oldDelta-oldDelta*speedType.accelerationMax<delta) delta = oldDelta-oldDelta*speedType.accelerationMax;
				if(oldDelta+oldDelta*speedType.accelerationMax>delta) delta = oldDelta+oldDelta*speedType.accelerationMax;
			}
			if(offsetType!== "offsetScale" && Math.abs(idealDelta)>1 && Math.abs(delta)<1) delta = idealDelta>0?1:-1;
			if(offsetType!== "offsetScale" && Math.abs(fullDelta)<_PADDING/4) delta = 0;
			return delta;
		}
		let instantTargetOffset = {
			offsetX: old.offsetX + calcDelta("offsetX",speedSetting.translate),
			offsetY: old.offsetY + calcDelta("offsetY",speedSetting.translate),
			offsetScale: Math.abs(old.offsetScale + calcDelta("offsetScale",targetOffset.offsetScale>old.offsetScale?speedSetting.zoomIn:speedSetting.zoomOut)),
		}
		const instantTarget = offsetToBounds(instantTargetOffset, fitBounds);
		// Does this include strict bounds ?
		// if not, include them
		let strictOffset;
		if(mustKeepInRangeBounds.weight) strictOffset = scaleTo(mustKeepInRangeBounds,fitBounds,true);
		else strictOffset = scaleTo(mustKeepInRangeBounds,fitBounds);
		const strictBounds = offsetToBounds(strictOffset,fitBounds);
		const mergedBounds = mergeBounds(strictBounds,instantTarget);
		let mergedOffset;
		if(mustKeepInRangeBounds.weight){
			mergedBounds.cx = mustKeepInRangeBounds.cx;
			mergedBounds.cy = mustKeepInRangeBounds.cy;
			mergedBounds.weight = mustKeepInRangeBounds.weight;
			mergedOffset = scaleTo(mergedBounds,fitBounds,true);
		} else mergedOffset = scaleTo(mergedBounds,fitBounds);

		loopy.offsetX = mergedOffset.offsetX;
		loopy.offsetY = mergedOffset.offsetY;
		loopy.offsetScale = mergedOffset.offsetScale;
		self.olderOffset = old;
	}
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
function offsetToRealOffset(scale,offsetX,offsetY) {
	const canvasses = document.getElementById("canvasses");
	const CW = canvasses.clientWidth - _PADDING - _PADDING;
	const CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
	//const tx = offsetX*2*scale + canvasses.clientWidth*(1 - scale) - _PADDING*(2 + scale)
	let translateX = offsetX*2;
	let translateY = offsetY*2;
	translateX -= CW+_PADDING;
	translateY -= CH+_PADDING;
	translateX = scale*translateX;
	translateY = scale*translateY;
	translateX += CW+_PADDING;
	translateY += CH+_PADDING;
	if(loopy.embedded){
		translateX += _PADDING; // dunno why but this is needed
		translateY += _PADDING; // dunno why but this is needed
	}
	return {scale,translateX,translateY};
}
function applyZoomTransform(ctx){
	// Translate to center, (translate, scale, translate) to expand to size
	const real = offsetToRealOffset(loopy.offsetScale,loopy.offsetX,loopy.offsetY);
	//console.log(tx, ty);
	ctx.setTransform(real.scale, 0, 0, real.scale, real.translateX, real.translateY);

}
// camera misc
function fitToBounds() {
	const canvasses = document.getElementById("canvasses");
	const fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
	const fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
	return {
		left:  _PADDING,
		top:   _PADDING,
		right: fitWidth+_PADDING,
		bottom:fitHeight+_PADDING,
		cx:    (_PADDING+fitWidth)/2,
		cy:    (_PADDING+fitHeight)/2,
	}
}
function calcWidthHeight(bounds) {
	bounds.width = bounds.right-bounds.left;
	bounds.height = bounds.bottom-bounds.top;
}
function calcCenteredWidthHeight(bounds) {
	if(typeof bounds.cx === "undefined" || typeof bounds.cy === "undefined"){
		bounds.cx = (bounds.right+bounds.left)/2;
		bounds.cy = (bounds.bottom+bounds.top)/2;
	}
	bounds.width = 2*Math.max(bounds.right-bounds.cx,bounds.cx-bounds.left);
	bounds.height = 2*Math.max(bounds.bottom-bounds.cy,bounds.cy-bounds.top);
}
function scaleTo(makeTheseBounds,fitInTheseBounds,alignCenter=false){
	let scaleRatio;
	calcWidthHeight(fitInTheseBounds);
	if(alignCenter) calcCenteredWidthHeight(makeTheseBounds);
	else calcWidthHeight(makeTheseBounds);
	scaleRatio = Math.min(fitInTheseBounds.width/makeTheseBounds.width,fitInTheseBounds.height/makeTheseBounds.height);
	const cx = (makeTheseBounds.right+makeTheseBounds.left)/2;
	const cy = (makeTheseBounds.bottom+makeTheseBounds.top)/2;
	return {
		offsetX: fitInTheseBounds.cx - cx,
		offsetY: fitInTheseBounds.cy - cy,
		offsetScale: scaleRatio
	}
}
function SpeedSettings(){
	const self = this;
	self.translate = {
		inertia:0.8,
		speedMaxPercent:0.05,
		accelerationMax: 2,
	};
	self.zoomIn = {
		inertia:0.8,
		speedMaxPercent:0.03,
		accelerationMax: 0.2,
	};
	self.zoomOut = {
		inertia:0.8,
		speedMaxPercent:0.05,
		accelerationMax: 2.5,
	};
	return self;
}