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
	function externalizeStrings(){
		// for each type (nodes, edges, labels, groups), list strings fields
		// for each element of each type and for each string fields, store stringData as key with length as value.
		// sort by length (and alphabetically if length is equal)
		// replace length by order index
		// for each element of each type and for each string fields, add element.stringFieldNameIndex = the string index
		// export the string array

		// concatenate all strings map all characters used, choose an other as separator
		// concatenate them again with the separator between each
		// BWT transform them // or BWT BWFT ZRL BWBT EC SFE MTF JBE EJBE
		// index symbols and reduce bit by symbols if the result is smaller than original

		// OR JUST concatenate them with ` as separator and hope LZMA will do the job.

		const stringFields = [];
		for(let typeIndex in EDIT_MODEL) if(EDIT_MODEL.hasOwnProperty(typeIndex))
			for(let i in EDIT_MODEL[typeIndex]) if(EDIT_MODEL[typeIndex].hasOwnProperty(i)) {
			const field = EDIT_MODEL[typeIndex][i];
			if(!field.options && !field.html) stringFields.push({type:typeIndex,fieldName:field.name});
		}

		const strings = [];
		for(let stringField of stringFields){
			const typeName = get_PERSIST_TYPE_array()[stringField["type"]]._CLASS_.toLowerCase();
			loopy.model[`${typeName}s`].forEach((item)=>strings.push(item[stringField["fieldName"]]));
		}
		const utf8string = strings.join('`');
		const stringUint8Array = (new StringView(utf8string)).rawData;
		//console.log(utf8string.length,stringUint8Array.length);
		return stringUint8Array;
	}
	self.serializeToBinary = function(embed) {
		const entitiesKindsCount = 4; // nodes, edges, labels, loopys //, groups, groupPairs
		const entitiesCount = countEntities();
		const bitToRefAnyEntity = entityRefBitSize();
		const entitiesSizes = entitiesSize(true);

		let size = 10+Object.keys(entitiesCount).length*bitToRefAnyEntity+Object.keys(entitiesSizes).length*8+entitiesSizes['loopys'];//+stringArea.length*8;
		size = Math.ceil(size/8)*8;
		for (let entity in entitiesCount) size+=Math.ceil(entitiesCount[entity]/8)*8*entitiesSizes[entity];

		const bitArray = new BitArray(size);
		bitArray.append(0,1);// Version number (This Version Start With 0, on 1bit, to allow evolution starting with 1)
		bitArray.append(1,1);// 0: withSpecific optimisations 1:padded to Bytes for better LZMA compression
		bitArray.append(embed?1:0,1);
		bitArray.append(entitiesKindsCount,4);
		bitArray.append(bitToRefAnyEntity,4);
		for (let entity in entitiesCount) bitArray.append(entitiesCount[entity],bitToRefAnyEntity);
		for (let entity in entitiesSizes) if(entity==="loopys" || entitiesCount[entity]) bitArray.append(entitiesSizes[entity],8);
		saveToBinary(bitArray,loopy,3,entitiesSizes["loopys"],bitArray.maxOffset);

		const appendArea = (bitArray,typeStr,entitiesSizes)=>{
			const areaStart = Math.ceil(bitArray.maxOffset/8)*8;
			bitArray.setOffset(areaStart);
			loopy.model[typeStr].forEach((n)=>saveToBinary(bitArray,n,objTypeToTypeIndex(typeStr),entitiesSizes[typeStr],areaStart,true));
			bitArray.rotate(entitiesSizes[typeStr],Math.ceil(loopy.model[typeStr].length/8)*8,areaStart);
		}
		appendArea(bitArray,"nodes",entitiesSizes);
		appendArea(bitArray,"edges",entitiesSizes);
		appendArea(bitArray,"labels",entitiesSizes);
		//appendArea(bitArray,"groups",entitiesSizes);
		//appendArea(bitArray,"groupPairs",entitiesSizes);

		//console.log(`pre-compressed bin size : ${bitArray.maxOffset}b + strArea`);
		const stringArea = externalizeStrings();
		//console.log(`strArea bin size : ${stringArea.buffer.byteLength*8}b`);
		//console.log("stringArea char stats : ",Object.values(statArray(stringArea)).sort((a,b)=>a<b));

		const realBytesSize = Math.ceil(bitArray.maxOffset/8);
		const bin = new Uint8Array(realBytesSize + stringArea.buffer.byteLength);
		bin.set(new Uint8Array(bitArray.rawData.buffer,0,realBytesSize), 0);
		bin.set(stringArea, realBytesSize);

		const compressedBin = LZMA.compress(bin,9).map((v)=>v<0?v+256:v);

		function b64l(bArr){return stdB64ToUrl(base64EncArr(bArr)).length;}
		console.log(`bin: ${b64l(bin)}, zbin: ${b64l(compressedBin)},`);
		if(bin.buffer.byteLength < compressedBin.length) return bin;
		return compressedBin;
	};
	self.serializeToUrl = (embed)=> {
		const bin = stdB64ToUrl(base64EncArr(self.serializeToBinary(embed)));
		const json = self.serializeToLegacyJson(embed);
		const compressedJson = stdB64ToUrl(base64EncArr(LZMA.compress(json,9).map((v)=>v<0?v+256:v)));
		console.log(`json: ${json.length}, zjson: ${compressedJson.length}`);
		if(json.length<bin.length && json.length<compressedJson.length) return json;
		if(compressedJson.length<bin.length && compressedJson.length<json.length) return compressedJson;
		return bin;
	};
	self.serializeToLegacyJson = function(embed){
		const data = [];
		// 0 - nodes
		// 1 - edges
		// 2 - labels
		// 3 - globalState (including UID)
		data.push(self.nodes.map(n=>legacyJsonPersistProps(n)));
		data.push(self.edges.map(n=>legacyJsonPersistProps(n)));
		data.push(self.labels.map(n=>legacyJsonPersistProps(n)));
		data.push(legacyJsonPersistProps(loopy));
		// Return as string!
		return JSON.stringify(data);
	};
	self.serializeToHumanReadableJson = function(embed){
		const json = {
			globals:humanReadableJsonPersistProps(loopy),
			nodes:self.nodes.map(n=>humanReadableJsonPersistProps(n)),
			edges:self.edges.map(n=>humanReadableJsonPersistProps(n)),
			labels:self.labels.map(n=>humanReadableJsonPersistProps(n))
		};
		if(embed) json.globals.embed=true;
		return JSON.stringify(json);
	};

	self.deserializeFromUrl = (dataString)=>{
		if(dataString[0]==='[') return self.deserializeFromLegacyJson(dataString);
		else if(dataString[0]==='{') return self.deserializeFromHumanReadableJson(dataString);
		else return self.deserializeFromBinary(base64DecToArr(urlToStdB64(dataString)).map((v)=>v>128?v-256:v));
	};
	self.deserializeFromBinary = (dataUint8Array)=>{
		let bin = dataUint8Array;
		if(bin[0]===93) bin = LZMA.decompress(dataUint8Array);

		//FIXME: implement binary deserializer
		return self.deserializeFromLegacyJson(LZMA.decompress(dataUint8Array));
	};
	self.deserializeFromHumanReadableJson = (dataString)=>{
		const data = JSON.parse(dataString);
		self.importModel(data);
	};
	self.importModel = (newModel)=>{
		self.clear();
		for(let key in newModel.globals)loopy[key] = newModel.globals[key];
		if(loopy.embed) loopy.embedded = 1;
		applyInitialPropEffects(loopy);
		// refresh sidebar
		const globalEditPage = loopy.sidebar.pages[3];
		injectPropsLabelInSideBar(globalEditPage,objTypeToTypeIndex("loopy"));

		// import entities data.
		newModel.nodes.forEach((n,i)=>self.addNode(n));
		newModel.edges.forEach((n,i)=>self.addEdge(n));
		newModel.labels.forEach((n,i)=>self.addLabel(n));
		//newModel.groups.forEach((n,i)=>self.addGroup(n));
	}
	self.deserializeFromLegacyJson = (dataString)=>{
		self.clear();
		const data = JSON.parse(dataString);
		const newModel = {globals:{},nodes:[],edges:[],labels:[]};
		// Get from array!
		const nodes = data[0];
		const edges = data[1];
		const labels = data[2];
		const globalState = data[3];
		for(let i=0;i<nodes.length;i++) newModel.nodes.push(injectedRestoreProps(nodes[i],{},objTypeToTypeIndex("node")));
		for(let i=0;i<edges.length;i++) newModel.edges.push(injectedRestoreProps(edges[i],{},objTypeToTypeIndex("edge")));
		for(let i=0;i<labels.length;i++) newModel.labels.push(injectedRestoreProps(labels[i],{},objTypeToTypeIndex("label")));
		// META.
		const importArray = typeof globalState === "object"?globalState:[globalState];
		newModel.globals.embedded = loopy.embedded?1:importArray[3];
		newModel.globals = injectedRestoreProps(importArray,newModel.globals,objTypeToTypeIndex("loopy"));

		//LoopyNode._UID = importArray[0];
		legacyIdFix(newModel);
		self.importModel(newModel);
	};
	function legacyIdFix(newModel){
		newModel.nodes.forEach((n,i)=>{
			if(n.id && n.id !== i){
				const oldId = n.id;
				const newId = i;
				n.id = newId;
				newModel.edges.forEach(edge=>{
					if(edge.from===oldId) edge.from=newId;
					if(edge.to===oldId) edge.to=newId;
				});
			}
		});
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
