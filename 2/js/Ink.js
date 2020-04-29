/**********************************

LOOPY!
- with edit & play mode

TODO: smoother bezier curve?
TODO: when switch away tool, clear the Ink canvas

**********************************/

Ink.MINIMUM_RADIUS = LoopyNode.DEFAULT_RADIUS;
Ink.SNAP_TO_RADIUS = 25;

function Ink(loopy){

	const self = this;
	self.loopy = loopy;

	// Create canvas & context
	const canvas = _createCanvas();
	const ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;

	// Stroke data!
	self.strokeData = [];

	// Drawing!
	self.drawInk = function(){

		if(!Mouse.pressed) return;

		// Last point
		const lastPoint = self.strokeData[self.strokeData.length-1];

		// Style
		ctx.save()
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 5;
		ctx.lineCap = "round";

		// Draw line from last to current
		applyZoomTransform(ctx);
		ctx.beginPath();
		ctx.moveTo(lastPoint[0]*2, lastPoint[1]*2);
		ctx.lineTo(Mouse.x*2, Mouse.y*2);
		ctx.stroke();
		ctx.restore();

		// Update last point
		self.strokeData.push([Mouse.x,Mouse.y]);

	};
	self.reset = function(){
		ctx.clearRect(0,0,canvas.width,canvas.height); // Clear canvas
		self.strokeData = []; // Reset stroke data
	};
	subscribe("mousedown",function(){
		if(!areWeInkEditing()) return;

		// New stroke data
		self.strokeData = [];
		self.strokeData.push([Mouse.x,Mouse.y]);

		// Draw to canvas!
		self.drawInk();

	});
	subscribe("mousemove",function(){
		if(!areWeInkEditing()) return;
		self.drawInk();
	});
	subscribe("mouseup",function(){
		if(!areWeInkEditing()) return;

		if(self.strokeData.length<2) return;
		if(!Mouse.moved) return;

		/*************************
		
		Detect what you drew!
		1. Started in a node?
		1a. If ended near/in a node, it's an EDGE.
		2. If not, it's a NODE. // TODO: actual circle detection?

		*************************/

		// Started in a node?
		const startPoint = self.strokeData[0];
		let startNode = loopy.model.getNodeByPoint(startPoint[0], startPoint[1]);
		if(!startNode) startNode=loopy.model.getNodeByPoint(startPoint[0], startPoint[1], 20); // try again with buffer

		// Ended in a node?
		const endPoint = self.strokeData[self.strokeData.length-1];
		let endNode = loopy.model.getNodeByPoint(endPoint[0], endPoint[1]);
		if(!endNode) endNode=loopy.model.getNodeByPoint(endPoint[0], endPoint[1], 40); // try again with buffer

		// EDGE: started AND ended in nodes
		if(startNode && endNode){

			// Config!
			let edgeConfig = {
				from: startNode.id,
				to: endNode.id
			};

			// If it's the same node...
			if(startNode===endNode){

				// TODO: clockwise or counterclockwise???
				// TODO: if the arc DOES NOT go beyond radius, don't make self-connecting edge. also min distance.

				// Find rotation first by getting average point
				let bounds = _getBounds(self.strokeData);
				const x = (bounds.left+bounds.right)/2;
				const y = (bounds.top+bounds.bottom)/2;
				const dx = x-startNode.x;
				const dy = y-startNode.y;
				const angle = Math.atan2(dy,dx);

				// Then, find arc height.
				const translated = _translatePoints(self.strokeData, -startNode.x, -startNode.y);
				const rotated = _rotatePoints(translated, -angle);
				bounds = _getBounds(rotated);

				// Arc & Rotation!
				edgeConfig.rotation = angle*(360/Math.TAU) + 90;
				edgeConfig.arc = bounds.right;

				// ACTUALLY, IF THE ARC IS *NOT* GREATER THAN THE RADIUS, DON'T DO IT.
				// (and otherwise, make sure minimum distance of radius+25)
				if(edgeConfig.arc < startNode.radius){
					edgeConfig=null;
					loopy.sidebar.edit(startNode); // you were probably trying to edit the node
				}else{
					const minimum = startNode.radius+25;
					if(edgeConfig.arc<minimum) edgeConfig.arc=minimum;
				}

			}else{

				// Otherwise, find the arc by translating & rotating
				const dx = endNode.x-startNode.x;
				const dy = endNode.y-startNode.y;
				const angle = Math.atan2(dy,dx);
				const translated = _translatePoints(self.strokeData, -startNode.x, -startNode.y);
				const rotated = _rotatePoints(translated, -angle);
				const bounds = _getBounds(rotated);
				
				// Arc!
				if(Math.abs(bounds.top)>Math.abs(bounds.bottom)) edgeConfig.arc = -bounds.top;
				else edgeConfig.arc = -bounds.bottom;

			}

			// Add the edge!
			if(edgeConfig){
				const newEdge = loopy.model.addEdge(edgeConfig);
				loopy.sidebar.edit(newEdge);
			}

		}

		// NODE: did NOT start in a node.
		if(!startNode){

			// Just roughly make a circle the size of the bounds of the circle
			const bounds = _getBounds(self.strokeData);
			const x = (bounds.left+bounds.right)/2;
			const y = (bounds.top+bounds.bottom)/2;
			let r = ((bounds.width/2)+(bounds.height/2))/2;

			// Circle can't be TOO smol
			if(r>15){

				// Snap to radius
				/*r = Math.round(r/Ink.SNAP_TO_RADIUS)*Ink.SNAP_TO_RADIUS;
				if(r<Ink.MINIMUM_RADIUS) r=Ink.MINIMUM_RADIUS;*/

				// LOCK TO JUST SMALLEST CIRCLE.
				r = Ink.MINIMUM_RADIUS;

				// Make that node!
				const newNode = loopy.model.addNode({
					x:x,
					y:y,
					radius:r
				});

				// Edit it immediately
				loopy.sidebar.edit(newNode);

			}

		}

		// Reset.
		self.reset();

	});
	subscribe("mouseclick",function(){
		if(!areWeInkEditing()) return;
		self.reset();
	});
	const areWeInkEditing = () => self.loopy.mode===Loopy.MODE_EDIT && self.loopy.tool===Loopy.TOOL_INK;

}