/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	var self = this;

	// Edit
	self.edit = function(object){
		self.showPage(object._CLASS_);
		self.currentPage.edit(object);
	};

	// Go back to main when the thing you're editing is killed
	subscribe("kill",function(object){
		if(self.currentPage.target==object){
			self.showPage("Edit");
		}
	});

	// Pages
	self.dom = document.getElementById("sidebar");
	self.pages = [];
	self.addPage = function(id, page){
		page.id = id;
		self.dom.appendChild(page.dom);
		self.pages.push(page);
	};
	self.currentPage = null;
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
		self.currentPage = shownPage;
	};

	///////////////////////
	// ACTUAL PAGES ///////
	///////////////////////

	// Node!
	(function(){
		var page = new SidebarPage();
		page.addComponent("label", new ComponentInput({
			label: "Name:"
		}));
		page.addComponent("hue", new ComponentSlider({
			bg: "color",
			label: "Color:",
			options: [0,30,60,120,180,240]
		}));
		page.addComponent("init", new ComponentSlider({
			bg: "initial",
			label: "Initial Value:",
			options: [-1,-0.66,-0.33,0,0.33,0.66,1]
		}));
		page.onedit = function(){
			var color = "hsl("+page.target.hue+",80%,58%)";
			page.getComponent("init").setBGColor(color);
		};
		/*page.addComponent(new ComponentButton({
			label: "delete node",
			onclick: function(node){
				node.kill();
				self.showPage("Edit");
			}
		}));*/
		self.addPage("Node", page);
	})();

	// Edge!
	var page = new SidebarPage();
	page.addComponent("strength", new ComponentSlider({
		bg: "strength",
		label: "Relationship:",
		options: [-3,-2,-1,1,2,3]
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
	self.componentsByID = {};
	self.addComponent = function(propName, component){

		// One or two args
		if(!component){
			component = propName;
			propName = "";
		}

		component.page = self; // tie to self
		component.propName = propName; // tie to propName
		self.dom.appendChild(component.dom); // add to DOM

		// remember component
		self.components.push(component);
		self.componentsByID[propName] = component;

	};
	self.getComponent = function(propName){
		return self.componentsByID[propName];	
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

		// Callback!
		self.onedit();

	};

	// On edit: TO IMPLEMENT
	self.onedit = function(){
		// TO BE IMPLEMENTED
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
		self.page.onedit(); // callback!
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
	input.oninput = function(event){
		self.setValue(input.value);
	};
	input.addEventListener("keydown",function(event){
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
	},false); // STOP IT FROM TRIGGERING KEY.js
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
	// TODO: DRAGGABLE SLIDER
	self.dom = document.createElement("div");
	var label = _createLabel(config.label);
	var slider = new Image();
	slider.draggable = false;
	slider.src = "css/sliders/"+config.bg+".png";
	slider.setAttribute("class","component_slider");
	self.dom.appendChild(label);
	self.dom.appendChild(slider);

	// On click... (or on drag)
	var sliderInput = function(event){

		// The option selected?
		var index = event.offsetX/250;
		var optionIndex = Math.floor(index*config.options.length);
		var option = config.options[optionIndex];
		if(option===undefined) return;
		self.setValue(option);

	};
	slider.onmousedown = sliderInput;
	//slider.ondrag = sliderInput;

	// Show
	self.show = function(){
		/*var value = self.getValue();
		if(config.map){
			for(var key in config.map){
				if(config.map[key]==value){
					value=key;
					break;
				}
			}
		}*/
		//input.value = value;
	};

	// Focus
	/*self.focus = function(){
		input.select();
	};*/

	// BG Color!
	self.setBGColor = function(color){
		slider.style.background = color;
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