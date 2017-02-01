/**********************************

DRAGGER

TODO: Dragging edges, too

**********************************/

function Dragger(loopy){

	var self = this;
	self.loopy = loopy;

	// Dragging anything?
	self.dragging = null;
	self.offsetX = 0;
	self.offsetY = 0;

	subscribe("mousedown",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// Any node under here? If so, start dragging!
		var dragNode = loopy.model.getNodeByPoint(Mouse.x, Mouse.y);
		if(dragNode){
			self.dragging = dragNode;
			self.offsetX = Mouse.x - dragNode.x;
			self.offsetY = Mouse.y - dragNode.y;
			loopy.sidebar.edit(dragNode); // and edit!
			return;
		}

		// Any edge under here? If so, start dragging!
		var dragEdge = loopy.model.getEdgeByPoint(Mouse.x, Mouse.y);
		if(dragEdge){
			self.dragging = dragEdge;
			self.offsetX = Mouse.x - dragEdge.labelX;
			self.offsetY = Mouse.y - dragEdge.labelY;
			loopy.sidebar.edit(dragEdge); // and edit!
			return;
		}

	});
	subscribe("mousemove",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// If you're dragging a NODE, move it around!
		if(self.dragging && self.dragging._CLASS_=="Node"){
			var node = self.dragging;
			node.x = Mouse.x - self.offsetX;
			node.y = Mouse.y - self.offsetY;
		}

		// If you're dragging an EDGE, move it around!
		if(self.dragging && self.dragging._CLASS_=="Edge"){

			var edge = self.dragging;
			var labelX = Mouse.x - self.offsetX;
			var labelY = Mouse.y - self.offsetY;

			// TODO: also works for self-arrow!
			if(edge.from!=edge.to){

				// The Arc: whatever label *Y* is, relative to angle & first node's pos
				var fx=edge.from.x, fy=edge.from.y, tx=edge.to.x, ty=edge.to.y;
				var dx=tx-fx, dy=ty-fy;
				var a = Math.atan2(dy,dx);

				// Calculate arc
				var points = [[labelX,labelY]];
				var translated = _translatePoints(points, -fx, -fy);
				var rotated = _rotatePoints(translated, -a);
				var newLabelPoint = rotated[0];

				// ooookay.
				edge.arc = -newLabelPoint[1]; // WHY NEGATIVE? I DON'T KNOW.

				// update coz visual glitches
				loopy.model.update();

			}

		}

	});
	subscribe("mouseup",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_DRAG) return;

		// Let go!
		self.dragging = null;
		self.offsetX = 0;
		self.offsetY = 0;

	});

}