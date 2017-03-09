/**********************************

PLAY CONTROLS CODE:
- play
- pause/reset/speed

**********************************/

function PlayControls(loopy){

	var self = this;
	PageUI.call(self, document.getElementById("playbar"));

	self.loopy = loopy;

	// PAGES & BUTTONS

	// PLAY BUTTON's keyboard shortcut
	// TODO: Toggle back & forth??????
	subscribe("key/enter",function(){
		if(Key.control){ // Ctrl-Enter or ⌘-Enter
			loopy.setMode(Loopy.MODE_PLAY);
		}
	});

	// During the Editor
	(function(){
		var page = new PlayPage();

		// PLAY BUTTON
		var buttonDOM = page.addComponent(new PlayButton({
			header: true,
			label: "▶ Play",
			tooltip: isMacLike ? "⌘-Enter" : "control-enter",
			onclick: function(){
				loopy.setMode(Loopy.MODE_PLAY);
				//self.showPage("Edit");
			}
		})).dom;
		buttonDOM.style.fontSize = "30px";
		buttonDOM.style.height = "35px";

		self.addPage("Editor", page);
	})();

	// During the Player
	(function(){
		var page = new PlayPage();

		// STOP BUTTON
		var buttonDOM = page.addComponent(new PlayButton({
			header: true,
			label: "Stop",
			onclick: function(){
				loopy.setMode(Loopy.MODE_EDIT);
			}
		})).dom;
		buttonDOM.style.width = "100px";
		buttonDOM.style.left = "0px";
		buttonDOM.style.top = "0px";

		// RESET BUTTON
		var buttonDOM = page.addComponent(new PlayButton({
			header: true,
			label: "Reset",
			onclick: function(){
				publish("model/reset");
			}
		})).dom;
		buttonDOM.style.width = "100px";
		buttonDOM.style.right = "0px";
		buttonDOM.style.top = "0px";

		// SPEED SLIDER
		var speedSlider = page.addComponent(new PlaySlider({
			value: loopy.signalSpeed,
			min:0, max:6, step:0.1,
			oninput: function(value){
				loopy.signalSpeed = value;
			}
		})).dom;
		speedSlider.style.bottom = "0px";

		self.addPage("Player", page);

	})();
	
}

function PlayPage(){

	var self = this;

	// DOM
	self.dom = document.createElement("div");
	self.show = function(){ self.dom.style.display="block"; };
	self.hide = function(){ self.dom.style.display="none"; };

	// Add Component
	self.addComponent = function(component){
		self.dom.appendChild(component.dom); // add to DOM
		return component;
	};

}
function PlayButton(config){
	var self = this;
	self.dom = _createButton(config.label, function(){
		config.onclick();
	});

	// Tooltip!
	if(config.tooltip){
		self.dom.setAttribute("data-balloon", config.tooltip);
		self.dom.setAttribute("data-balloon-pos", "top");
	}
}
function PlaySlider(config){

	var self = this;
	var input = document.createElement("input");
	input.setAttribute("class","play_slider");
	self.dom = input;

	// Properties
	input.type = "range";
	input.value = config.value;
	input.step = config.step;
	input.min = config.min;
	input.max = config.max;
	input.oninput = function(event){
		config.oninput(input.value);
	};

}