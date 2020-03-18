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
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		page.addComponent("label", new ComponentInput({
			label: "<br><br>Name:"
			//label: "Name:"
		}));
		page.addComponent("hue", new ComponentSlider({
			bg: "color",
			label: "Color:",
			options: [0,1,2,3,4,5],
			oninput: function(value){
				Node.defaultHue = value;
			}
		}));
		page.addComponent("init", new ComponentSlider({
			bg: "initial",
			label: "Start Amount:",
			options: [0, 0.16, 0.33, 0.50, 0.66, 0.83, 1],
			//options: [0, 1/6, 2/6, 3/6, 4/6, 5/6, 1],
			oninput: function(value){
				Node.defaultValue = value;
			}
		}));
		injectPropsInSideBar(page,objTypeToTypeIndex("node"));

		page.onedit = function(){

			// Set color of Slider
			const node = page.target;
			const color = Node.COLORS[node.hue];
			page.getComponent("init").setBGColor(color);

			// Focus on the name field IF IT'S "" or "?"
			const name = node.label;
			if(name==="" || name==="?") page.getComponent("label").select();
			injectPropsLabelInSideBar(page,objTypeToTypeIndex("node"));
		};
		page.addComponent(new ComponentButton({
			label: "delete node",
			//label: "delete circle",
			onclick: function(node){
				node.kill();
				self.showPage("Edit");
			}
		}));
		self.addPage("Node", page);
	})();

	// Edge!
	(function(){
		const page = new SidebarPage();
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		const strengthLinkLabel = [];
		strengthLinkLabel[-1] =	"<br><br>Relationship : invert effect";
		strengthLinkLabel[1] =	"<br><br>Relationship : same effect";
		page.addComponent("strength", new ComponentSlider({
			bg: "strength",
			label: "<br><br>Relationship:",
			//label: "Relationship:",
			options: [1, -1],
			//advanced: true,
			defaultValue: 1,
			oninput: function(value){
				Edge.defaultStrength = value;
			}
		}));
		injectPropsInSideBar(page,objTypeToTypeIndex("edge"));

		page.addComponent(new ComponentHTML({
			html: "(to make a stronger relationship, draw multiple arrows!)<br><br>"+
			"(to make a delayed relationship, draw longer arrows)"
		}));
		page.addComponent(new ComponentButton({
			//label: "delete edge",
			label: "delete arrow",
			//label: "delete relationship",
			onclick: function(edge){
				edge.kill();
				self.showPage("Edit");
			}
		}));
		page.onedit = function(){
			const edge = page.target;
			page.getComponent("strength").dom.querySelector('.component_label').innerHTML = strengthLinkLabel[edge.strength];
			injectPropsLabelInSideBar(page,objTypeToTypeIndex("edge"));
		};
		self.addPage("Edge", page);
	})();

	// Label!
	(function(){
		const page = new SidebarPage();
		page.addComponent(new ComponentButton({
			header: true,
			label: "back to top",
			onclick: function(){
				self.showPage("Edit");
			}
		}));
		page.addComponent("text", new ComponentInput({
			label: "<br><br>Label:",
			//label: "Label:",
			textarea: true
		}));
		page.onshow = function(){
			// Focus on the text field
			page.getComponent("text").select();
		};
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
		page.addComponent(new ComponentButton({
			label: "delete label",
			onclick: function(label){
				label.kill();
				self.showPage("Edit");
			}
		}));
		self.addPage("Label", page);
	})();

	// Edit
	(function(){
		const page = new SidebarPage();
		page.addComponent(new ComponentHTML({
			html: ""+

				"<b style='font-size:1.4em'>LOOPY</b> (v1.2)<br>a tool for thinking in systems<br><br>"+

				"<span class='mini_button' onclick='publish(\"modal\",[\"examples\"])'>see examples</span> "+
				"<span class='mini_button' onclick='publish(\"modal\",[\"howto\"])'>how to</span> "+
				"<span class='mini_button' onclick='publish(\"modal\",[\"credits\"])'>credits</span><br><br>"+

				"<hr/><br>"+

				"<span class='mini_button' onclick='publish(\"modal\",[\"save_link\"])'>save as link</span> <br><br>"+
				"<span class='mini_button' onclick='publish(\"export/file\")'>save as file</span> "+
				"<span class='mini_button' onclick='publish(\"import/file\")'>load from file</span> <br><br>"+
				"<span class='mini_button' onclick='publish(\"modal\",[\"embed\"])'>embed in your website</span> <br><br>"+
				"<span class='mini_button' onclick='publish(\"modal\",[\"save_gif\"])'>make a GIF using LICEcap</span> <br><br>"+
				'<hr class="not_in_play_mode"/>'
		}));
		page.addComponent("loopyMode", new ComponentSlider({
			bg: "loopyMode",
			label: "Loopy mode : ",
			options: [0,1], // Simple || Advanced
			oninput: function(value){
				//self.sidebar.pages.forEach(function(page){page.dom.classList.add(loopy.globalState.loopyMode?"advanced":"simple");});
				let apply;
				if(value) apply = function(page){
					page.dom.classList.add("advanced");
					page.dom.classList.remove("simple");
				};
				else apply = function(page){
					page.dom.classList.add("simple");
					page.dom.classList.remove("advanced");
				};
				loopy.sidebar.pages.forEach(apply);
			}
		}));
		page.addComponent("colorMode", new ComponentSlider({
			bg: "colorMode",
			label: "Color mode : ",
			options: [0,1], // Aesthetic || Type logic
			advanced: true,
			defaultValue:0 // not advanced behavior when default
		}));
		page.addComponent(new ComponentHTML({
			html: ""+
			"<hr/><br>"+

			"<a target='_blank' href='../'>LOOPY</a> is "+
			"made by <a target='_blank' href='http://ncase.me'>nicky case</a> "+
			"with your support <a target='_blank' href='https://www.patreon.com/ncase'>on patreon</a> &lt;3<br><br>"+
			"<span style='font-size:0.85em'>P.S: go read <a target='_blank' href='https://www.amazon.com/Thinking-Systems-Donella-H-Meadows/dp/1603580557'>Thinking In Systems</a>, thx</span>"

		}));
		self.addPage("Edit", page);
	})();

	// Ctrl-S to SAVE
	subscribe("key/save",function(){
		if(Key.control){ // Ctrl-S or ⌘-S
			publish("modal",["save_link"]);
		}
	});

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
		if(self.page.target) return self.page.target[self.propName];
		else return loopy.globalState[self.propName];
	};
	self.setValue = function(value){
		
		// Model's been changed!
		publish("model/changed");

		// Edit the value!
		if(self.page.target) self.page.target[self.propName] = value;
		else loopy.globalState[self.propName] = value;
		self.page.onedit(); // callback!
		
	};
}

function ComponentInput(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: label + text input
	self.dom = document.createElement("div");
	const label = _createLabel(config.label);
	const className = config.textarea ? "component_textarea" : "component_input";
	const input = _createInput(className, config.textarea);
	input.oninput = function(){
		self.setValue(input.value);
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		input.value = self.getValue();
	};

	// Select
	self.select = function(){
		setTimeout(function(){ input.select(); },10);
	};

}

function ComponentSlider(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// TODO: control with + / -, alt keys??

	// DOM: label + slider
	self.dom = document.createElement("div");
	self.dom.classList.add('not_in_play_mode');
	if(config.advanced){
		self.dom.classList.add('adv');
		const adv = document.createElement("div");
		adv.innerHTML = "Advanced feature in use : ";
		adv.setAttribute("class","adv_disclaimer");
		self.dom.appendChild(adv);
	}
	const label = _createLabel(config.label);
	self.dom.appendChild(label);
	const sliderDOM = document.createElement("div");
	sliderDOM.setAttribute("class","component_slider");
	self.dom.appendChild(sliderDOM);

	// Slider DOM: graphic + pointer
	const slider = new Image();
	slider.draggable = false;
	slider.src = "css/sliders/"+config.bg+".png";
	slider.setAttribute("class","component_slider_graphic");
	const pointer = new Image();
	pointer.draggable = false;
	pointer.src = "css/sliders/slider_pointer.png";
	pointer.setAttribute("class","component_slider_pointer");
	sliderDOM.appendChild(slider);
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
	const updateClassActiveDefault = function () {
		if(self.getValue() === config.defaultValue) self.dom.classList.remove("active");
		else self.dom.classList.add("active");
	};
	const sliderInput = function(event){

		// What's the option?
		const index = event.x/250;
		const optionIndex = Math.floor(index*config.options.length);
		const option = config.options[optionIndex];
		if(option===undefined) return;
		self.setValue(option);

		updateClassActiveDefault();

		// Callback! (if any)
		injectPropsUpdateDefault(self,option);
		if(config.oninput){
			config.oninput(option);
		}

		// Move pointer there.
		movePointer();

	};
	_addMouseEvents(slider, onmousedown, onmousemove, onmouseup);

	// Show
	self.show = function(){
		updateClassActiveDefault();
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
	self.dom.innerHTML = config.html;

}

function ComponentOutput(){ //(config)

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: just a readonly input that selects all when clicked
	self.dom = _createInput("component_output");
	self.dom.setAttribute("readonly", "true");
	self.dom.onclick = function(){
		self.dom.select();
	};

	// Output the string!
	self.output = function(string){
		self.dom.value = string;
	};

}