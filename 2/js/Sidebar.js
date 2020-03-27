/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	const self = this;
	PageUI.call(self, document.getElementById("sidebar"));

	// Edit
	self.edit = function(object){
		self.showPage(object._CLASS_);
		self.currentPage.edit(object);
	};

	// Go back to main when the thing you're editing is killed
	subscribe("kill",function(object){
		if(self.currentPage.target===object){
			self.showPage("Edit");
		}
	});

	////////////////////////////////////////////////////////////////////////////////////////////
	// ACTUAL PAGES ////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////

	// Node!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("node"));
		page.onshow = ()=> page.getComponent("label").select(); // Focus on the label field
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("node"));
		deleteMeButton(self, page, "delete node");
		self.addPage("Node", page);
	})();

	// Edge!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("edge"));
		deleteMeButton(self, page, "delete arrow");
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("edge"));
		self.addPage("Edge", page);
	})();

	// Label!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("label"));
		page.onshow = ()=> page.getComponent("text").select(); // Focus on the text field
		page.onhide = function(){
			// If you'd just edited it...
			const label = page.target;
			if(!page.target) return;
			// If text is "" or all spaces, DELETE.
			const text = label.text;
			if(/^\s*$/.test(text)){
				// that was all whitespace, KILL.
				page.target = null;
				label.kill();
			}
		};
		deleteMeButton(self, page, "delete label");
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("label"));
		self.addPage("Label", page);
	})();

	// Edit
	(function(){
		const page = new SidebarPage();
		page.target = loopy;
		injectPropsInSideBar(page,objTypeToTypeIndex("loopy"));
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("loopy"));
		self.addPage("Edit", page);
	})();

	// Ctrl-S to SAVE
	subscribe("key/save",function(){
		if(Key.control){ // Ctrl-S or ⌘-S
			publish("modal",["save_link"]);
		}
	});

}
function backToTopButton(sidebar, page){
	page.addComponent(new ComponentButton({
		header: true,
		label: "back to top",
		onclick: function(){
			sidebar.showPage("Edit");
		}
	}));
	page.addComponent(new ComponentHTML({html: "<br/>"}));
}
function deleteMeButton(sidebar, page, label){
	page.addComponent(new ComponentButton({
		label: label,
		onclick: function(me){
			me.kill();
			sidebar.showPage("Edit");
		}
	}));
}

function SidebarPage(){

	// TODO: be able to focus on next component with an "Enter".

	const self = this;
	self.target = null;

	// DOM
	self.dom = document.createElement("div");
	self.show = function(){ self.dom.style.display="block"; self.onshow(); };
	self.hide = function(){ self.dom.style.display="none"; self.onhide(); };

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

		// return!
		return component;

	};
	self.getComponent = function(propName){
		return self.componentsByID[propName];
	};

	// Edit
	self.edit = function(object){

		// New target to edit!
		self.target = object;

		// Show each property with its component
		for(let i=0;i<self.components.length;i++){
			self.components[i].show();
		}

		// Callback!
		self.onedit();

	};

	// TO IMPLEMENT: callbacks
	self.onedit = function(){};
	self.onshow = function(){};
	self.onhide = function(){};

	// Start hiding!
	self.hide();

}



/////////////////////////////////////////////////////////////////////////////////////////////
// COMPONENTS ///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

function Component(){
	const self = this;
	self.dom = null;
	self.page = null;
	self.propName = null;
	self.show = function(){
		// TO IMPLEMENT
	};
	self.getValue = function(){
		return self.page.target[self.propName];
	};
	self.setValue = function(value){
		
		// Model's been changed!
		publish("model/changed");

		// Edit the value!
		self.page.target[self.propName] = value;

		updateDocLink(self);
		self.page.onedit(); // callback!
		
	};
	self.setBGColor = function () {}
}
function updateDocLink(component) {
	let type = component.page.id;
	if(type==="Edit") type = 'Global';
	component.dom.querySelector('.docLink').href = `javascript:publish("modal",["doc","${type}/${component.propName}/${component.getValue()}"])`;
}

function ComponentInput(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: label + text input
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const label = _createLabel(config.label);
	const className = config.textarea ? "component_textarea" : "component_input";
	const input = _createInput(className, config.textarea);
	input.oninput = function(){
		self.setValue(input.value);
		updateClassActiveDefault(self,config.defaultValue);
		if(config.oninput){
			config.oninput(self,self.getValue());
		}
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		input.value = self.getValue();
		updateClassActiveDefault(self,config.defaultValue);
		updateDocLink(self);
	};

	// Select
	self.select = function(){
		setTimeout(function(){ input.select(); },10);
	};

}
function advancedConditionalDisplay(self) {
	self.dom.classList.add('adv');
	const adv = document.createElement("div");
	adv.innerHTML = "Advanced feature in use : ";
	adv.setAttribute("class","adv_disclaimer");
	self.dom.appendChild(adv);
}
function colorLogicConditionalDisplay(self) {
	self.dom.classList.add('colorLogic');
	const adv = document.createElement("div");
	adv.innerHTML = "This feature need activated colorLogic !";
	adv.setAttribute("class","colorLogic_disclaimer");
	self.dom.appendChild(adv);
}
function simpleOnlyConditionalDisplay(self) {
	self.dom.classList.add('simpleOnly');
}
function updateClassActiveDefault(self, defaultValue) {
	if(self.getValue() === defaultValue)self.dom.classList.remove("active");
	else self.dom.classList.add("active");

	if(self.page.dom.querySelector('.adv.active')){
		const simpleOnly = self.page.dom.querySelectorAll('.simpleOnly');
		for(let so of simpleOnly) so.classList.add("inactive");
	} else {
		const simpleOnly = self.page.dom.querySelectorAll('.simpleOnly');
		for(let so of simpleOnly) so.classList.remove("inactive");
	}
}
function ComponentSlider(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// TODO: control with + / -, alt keys??

	// DOM: label + slider
	self.dom = document.createElement("div");
	self.dom.classList.add('not_in_play_mode');
	if(config.combineWithNext) self.dom.classList.add('combineWithNext');
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const label = _createLabel(config.label);
	self.dom.appendChild(label);
	const sliderDOM = document.createElement("div");
	sliderDOM.classList.add("component_slider");
	self.dom.appendChild(sliderDOM);

	// Slider DOM: graphic + pointer
	const slider = new Image();
	slider.draggable = false;
	slider.src = "css/sliders/"+config.bg+".png";
	slider.setAttribute("class","component_slider_graphic");
	sliderDOM.appendChild(slider);
	//TODO: implement the following
	if(config.dynamicUI){
		if(config.dynamicUI.mergedPointer){
			//addClass to add space for pointer in following images
		}
		if(config.dynamicUI.activeAtLeft){
			//addLeftImage
		}
		if(config.dynamicUI.activeAtRight){
			//addRightImage
		}
		if(config.dynamicUI.active){
			//addActiveImage
		}
		if(config.dynamicUI.hover){
			//addHoverImage
		}
	}
	const pointer = new Image();
	pointer.draggable = false;
	pointer.src = `css/sliders/slider_pointer_${config.combineWithNext?'down':'up'}.png`;
	pointer.setAttribute("class","component_slider_pointer");
	sliderDOM.appendChild(pointer);
	const movePointer = function(){
		const value = self.getValue();
		const optionIndex = config.options.indexOf(value);
		const x = (optionIndex+0.5) * (250/config.options.length);
		pointer.style.left = (x-7.5)+"px";
	};

	// On click... (or on drag)
	let isDragging = false;
	const onmousedown = function(event){
		isDragging = true;
		sliderInput(event);
	};
	const onmouseup = function(){
		isDragging = false;
	};
	const onmousemove = function(event){
		if(isDragging) sliderInput(event);
	};
	const sliderInput = function(event){

		// What's the option?
		const index = event.x/250;
		const optionIndex = Math.floor(index*config.options.length);
		const option = config.options[optionIndex];
		if(option===undefined) return;
		self.setValue(option);

		updateClassActiveDefault(self,config.defaultValue);

		// Callback! (if any)
		injectPropsUpdateDefault(self,option);
		if(config.oninput){
			config.oninput(self,option);
		}

		// Move pointer there.
		movePointer();

	};
	_addMouseEvents(slider, onmousedown, onmousemove, onmouseup);

	// Show
	self.show = function(){
		updateClassActiveDefault(self,config.defaultValue);
		updateDocLink(self);
		movePointer();
	};

	// BG Color!
	self.setBGColor = function(color){
		slider.style.background = color;
	};

}

function ComponentButton(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: just a button
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const button = _createButton(config.label, function(){
		config.onclick(self.page.target);
	});
	self.dom.appendChild(button);

	// Unless it's a HEADER button!
	if(config.header){
		button.setAttribute("header","yes");
	}

}

function ComponentHTML(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// just a div
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	self.dom.innerHTML = config.html;

}

function ComponentOutput(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: just a readonly input that selects all when clicked
	self.dom = _createInput("component_output");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	self.dom.setAttribute("readonly", "true");
	self.dom.onclick = function(){
		self.dom.select();
	};

	// Output the string!
	self.output = function(string){
		self.dom.value = string;
	};

}
