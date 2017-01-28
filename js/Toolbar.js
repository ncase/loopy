/**********************************

TOOLBAR CODE

**********************************/

function Toolbar(loopy){

	var self = this;

	// Tools & Buttons
	self.dom = document.createElement("div");
	document.getElementById("toolbar").appendChild(self.dom);
	self.addButton = function(img, callback){
		var button = new Image();
		button.src = img;
		button.setAttribute("class","toolbar_button");
		self.dom.appendChild(button);
		button.onclick = callback;
	};

	// Populate those buttons!
	self.addButton("css/icons/ink.png", function(){
		loopy.tool = Loopy.TOOL_INK;
	});
	self.addButton("css/icons/drag.png", function(){
		loopy.tool = Loopy.TOOL_DRAG;
	});
	self.addButton("css/icons/erase.png", function(){
		loopy.tool = Loopy.TOOL_ERASE;
	});

}