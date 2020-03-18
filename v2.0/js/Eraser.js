/**********************************

ERASER

**********************************/

function Eraser(loopy){

	const self = this;
	self.loopy = loopy;

	self.erase = function(clicked){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!==Loopy.MODE_EDIT) return;
		if(self.loopy.tool!==Loopy.TOOL_ERASE) return;

		// Erase any nodes under here
		if(Mouse.pressed || clicked){
			const eraseNode = loopy.model.getNodeByPoint(Mouse.x, Mouse.y);
			if(eraseNode) eraseNode.kill();
		}

		// Erase any edges under here
		if(Mouse.pressed || clicked){
			const eraseEdge = loopy.model.getEdgeByPoint(Mouse.x, Mouse.y, true);
			if(eraseEdge) eraseEdge.kill();
		}

		// Erase any labels under here
		if(Mouse.pressed || clicked){
			const eraseLabel = loopy.model.getLabelByPoint(Mouse.x, Mouse.y);
			if(eraseLabel) eraseLabel.kill();
		}

	};

	subscribe("mousemove",function(){
		self.erase();
	});
	subscribe("mouseclick",function(){
		self.erase(true);
	});

}