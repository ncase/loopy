/**********************************

TOOLBAR CODE

**********************************/

function Toolbar(loopy){

	var self = this;

	// Tools & Buttons
	var buttons = [];
	var buttonsByID = {};
	self.dom = document.getElementById("toolbar");
	self.addButton = function(id, callback){

		// Add the button
		var button = new ToolbarButton(self,{
			id: id,
			icon: "css/icons/"+id+".png",
			callback: callback
		});
		self.dom.appendChild(button.dom);
		buttons.push(button);
		buttonsByID[id] = button;

		// Keyboard shortcut!
		(function(id){
			subscribe("key/"+id,function(){
				buttonsByID[id].callback();
			});
		})(id);

	};

	// Select button
	self.selectButton = function(button){
		for(var i=0;i<buttons.length;i++){
			buttons[i].deselect();
		}
		button.select();
	};

	// Set Tool
	self.currentTool = "ink";
	self.setTool = function(tool){
		self.currentTool = tool;
		var name = "TOOL_"+tool.toUpperCase();
		loopy.tool = Loopy[name];
		document.getElementById("canvasses").setAttribute("cursor",tool);
	};

	// Populate those buttons!
	self.addButton("ink", function(){
		self.setTool("ink");
	});
	self.addButton("label", function(){
		self.setTool("label");
	});
	self.addButton("drag", function(){
		self.setTool("drag");
	});
	self.addButton("erase", function(){
		self.setTool("erase");
	});

	// Select button
	buttonsByID.ink.callback();

	// Hide & Show

}

function ToolbarButton(toolbar, config){

	var self = this;
	self.id = config.id;

	// Icon
	self.dom = new Image();
	self.dom.src = config.icon;
	self.dom.setAttribute("class", "toolbar_button");

	// Selected?
	self.select = function(){
		self.dom.setAttribute("selected", "yes");
	};
	self.deselect = function(){
		self.dom.setAttribute("selected", "no");
	};

	// On Click
	self.callback = function(){
		config.callback();
		toolbar.selectButton(self);
	};
	self.dom.onclick = self.callback;

}