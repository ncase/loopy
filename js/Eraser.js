/**********************************

ERASER

**********************************/

function Eraser(loopy){

	var self = this;
	self.loopy = loopy;

	subscribe("mousemove",function(){

		// ONLY WHEN EDITING w DRAG
		if(self.loopy.mode!=Loopy.MODE_EDIT) return;
		if(self.loopy.tool!=Loopy.TOOL_ERASE) return;

		// Erase any nodes under here
		if(Mouse.pressed){
			var eraseNode = loopy.model.getNodeByPoint(Mouse.x, Mouse.y);
			if(eraseNode) eraseNode.kill();
		}

		// TODO: Erase any edges under here

	});

}