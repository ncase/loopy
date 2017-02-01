/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	var self = this;

	// Edit
	self.edit = function(object){
		var page = self.showPage(object._CLASS_);
		page.edit(object);
	};

	// Pages
	self.dom = document.getElementById("sidebar");
	self.pages = [];
	self.addPage = function(id, page){
		page.id = id;
		self.dom.appendChild(page.dom);
		self.pages.push(page);
	};
	self.showPage = function(id){
		var shownPage = null;
		for(var i=0; i<self.pages.length; i++){
			var page = self.pages[i];
			if(page.id==id){
				page.show();
				shownPage = page;
			}else{
				page.hide();
			}
		}
		return shownPage;
	};

	///////////////////////
	// ACTUAL PAGES ///////
	///////////////////////

	// Node!
	var page = new SidebarPage();
	page.addComponent("label", new ComponentInput({
		label: "Name:"
	}));
	page.addComponent("hue", new ComponentSlider({
		label: "Color:",
		min:0, max:360, step:30
	}));
	/*page.addComponent(new ComponentButton({
		label: "delete node",
		onclick: function(node){
			node.kill();
			self.showPage("Edit");
		}
	}));*/
	self.addPage("Node", page);

	// Edge!
	var page = new SidebarPage();
	page.addComponent("strength", new ComponentSlider({
		label: "Relationship:",
		min:0, max:5, step:1,
		map:{0:-3, 1:-2, 2:-1, 3:1, 4:2, 5:3}
	}));
	/*page.addComponent(new ComponentButton({
		label: "delete edge",
		onclick: function(edge){
			edge.kill();
			self.showPage("Edit");
		}
	}));*/
	self.addPage("Edge", page);

	// Edit
	var page = new SidebarPage();
	page.addComponent(new ComponentButton({
		label: "START SIMULATION",
		onclick: function(){
			loopy.setMode(Loopy.MODE_PLAY);
		}
	}));
	self.addPage("Edit", page);

	// Play
	var page = new SidebarPage();
	page.addComponent(new ComponentButton({
		label: "STOP SIMULATION",
		onclick: function(){
			loopy.setMode(Loopy.MODE_EDIT);
		}
	}));
	self.addPage("Play", page);

}

function SidebarPage(){

	// TODO: be able to focus on next component with an "Enter".

	var self = this;
	self.target = null;

	// DOM
	self.dom = document.createElement("div");
	self.show = function(){ self.dom.style.display="block"; };
	self.hide = function(){ self.dom.style.display="none"; };
	self.hide();

	// Components
	self.components = [];
	self.addComponent = function(propName, component){

		// One or two args
		if(!component){
			component = propName;
			propName = "";
		}

		component.page = self; // tie to self
		component.propName = propName; // tie to propName
		self.dom.appendChild(component.dom); // add to DOM
		self.components.push(component); // remember component
	};

	// Edit
	self.edit = function(object){

		// New target to edit!
		self.target = object;

		// Show each property with its component
		for(var i=0;i<self.components.length;i++){
			self.components[i].show();
		}

		// Focus on first one.
		setTimeout(function(){
			if(self.components.length>0) self.components[0].focus();
		},10);

	};

}



///////////////////////////////
// COMPONENTS /////////////////
///////////////////////////////

function Component(){
	var self = this;
	self.dom = null;
	self.page = null;
	self.propName = null;
	self.show = function(){
		// TO IMPLEMENT
	};
	self.focus = function(){
		// TO IMPLEMENT
	};
	self.getValue = function(){
		return self.page.target[self.propName];
	};
	self.setValue = function(value){
		self.page.target[self.propName] = value;
	};
}

function ComponentInput(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: label + text input
	self.dom = document.createElement("div");
	var label = _createLabel(config.label);
	var input = document.createElement("input");
	input.setAttribute("class","component_input");
	input.oninput = function(){
		self.setValue(input.value);
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		input.value = self.getValue();
	};

	// Focus
	self.focus = function(){
		input.select();
	};

}

function ComponentSlider(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// TODO: control with + / -, alt keys??

	// DOM: label + slider
	self.dom = document.createElement("div");
	var label = _createLabel(config.label);
	var input = document.createElement("input");
	input.type = "range";
	input.min = config.min;
	input.max = config.max;
	input.step = config.step;
	input.setAttribute("class","component_slider");
	input.oninput = function(){
		var value = input.value;
		if(config.map) value = config.map[value];
		self.setValue(value);
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		var value = self.getValue();
		if(config.map){
			for(var key in config.map){
				if(config.map[key]==value){
					value=key;
					break;
				}
			}
		}
		input.value = value;
	};

	// Focus
	self.focus = function(){
		input.select();
	};

}

function ComponentButton(config){

	// Inherit
	var self = this;
	Component.apply(self);

	// DOM: just a button
	self.dom = document.createElement("div");
	var button = _createButton(config.label, function(){
		config.onclick(self.page.target);
	});
	self.dom.appendChild(button);

}