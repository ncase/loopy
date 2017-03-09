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

	(function(){
		var page = new PlayPage();
		page.addComponent(new PlayButton({
			header: true,
			label: "▶ Play",
			onclick: function(){
				loopy.setMode(Loopy.MODE_PLAY);
				//self.showPage("Edit");
			}
		}));
		self.addPage("Editor", page);
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

	// Inherit
	var self = this;
	
	// DOM: just a button
	self.dom = document.createElement("div");
	var button = _createButton(config.label, function(){
		config.onclick();
	});
	self.dom.appendChild(button);

}