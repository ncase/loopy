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
		var page = new Page();

		// PLAY BUTTON
		var buttonDOM = page.addComponent(new PlayButton({
			icon: 0,
			label: "Play",
			tooltip: isMacLike ? "⌘-Enter" : "control-enter",
			onclick: function(){
				loopy.setMode(Loopy.MODE_PLAY);
				//self.showPage("Edit");
			}
		})).dom;
		buttonDOM.setAttribute("big","yes");
		buttonDOM.style.fontSize = "28px";
		buttonDOM.style.height = "35px";

		self.addPage("Editor", page);
	})();

	// During the Player
	(function(){
		var page = new Page();

		if(loopy.embedded){

			// Reset | Remix

			// RESET
			var buttonDOM = page.addComponent(new PlayButton({
				icon: 2,
				label: "Reset",
				onclick: function(){
					publish("model/reset");
				}
			})).dom;
			buttonDOM.style.width = "100px";
			buttonDOM.style.left = "0px";
			buttonDOM.style.top = "0px";

			// REMIX BUTTON
			var buttonDOM = page.addComponent(new PlayButton({
				icon: 3,
				label: "Remix",
				onclick: function(){
					var url = loopy.saveToURL();
					window.open(url,'_blank');
				}
			})).dom;
			buttonDOM.style.width = "100px";
			buttonDOM.style.right = "0px";
			buttonDOM.style.top = "0px";

		}else{

			// Stop | Reset

			// STOP BUTTON
			var buttonDOM = page.addComponent(new PlayButton({
				icon: 1,
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
				icon: 2,
				label: "Reset",
				onclick: function(){
					publish("model/reset");
				}
			})).dom;
			buttonDOM.style.width = "100px";
			buttonDOM.style.right = "0px";
			buttonDOM.style.top = "0px";

		}

		// SPEED SLIDER
		var speedSlider = page.addComponent(new PlaySlider({
			value: loopy.signalSpeed,
			min:0, max:6, step:0.2,
			oninput: function(value){
				loopy.signalSpeed = value;
			}
		})).dom;
		speedSlider.style.bottom = "0px";

		self.addPage("Player", page);

	})();
	
}

function PlayButton(config){

	var self = this;

	var label = "<div class='play_button_icon' icon='"+config.icon+"'></div> "
				+ "<div class='play_button_label'>"+config.label+"</div>";

	self.dom = _createButton(label, function(){
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
	self.dom = document.createElement("div");
	self.dom.style.bottom = "0px";
    self.dom.style.position = "absolute";
    self.dom.style.width = "100%";
    self.dom.style.height = "20px";

	// Input
	var input = document.createElement("input");
	input.setAttribute("class","play_slider");
	self.dom.appendChild(input);

	// Slow & Fast Icons
	var img = new Image();
	img.src = "css/icons/speed_slow.png";
	img.width = 20;
	img.height = 15;
	img.style.position = "absolute";
	img.style.left = "5px";
	img.style.top = "-2px";
	self.dom.appendChild(img);
	var img = new Image();
	img.src = "css/icons/speed_fast.png";
	img.width = 20;
	img.height = 15;
	img.style.position = "absolute";
	img.style.right = "5px";
	img.style.top = "-2px";
	self.dom.appendChild(img);

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