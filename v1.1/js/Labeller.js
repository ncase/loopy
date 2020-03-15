/**********************************

LABELLER

**********************************/

function Labeller(loopy){

	const self = this;
	self.loopy = loopy;

	self.tryMakingLabel = function(){

		// ONLY WHEN EDITING w LABEL
		if(self.loopy.mode!==Loopy.MODE_EDIT) return;
		if(self.loopy.tool!==Loopy.TOOL_LABEL) return;

		// And if ALREADY EDITING LABEL, just GO TO TOP.
		if(self.loopy.sidebar.currentPage.id === "Label"){
			loopy.sidebar.showPage("Edit");
			return;
		}

		// Otherwise, make it & edit it!
		const newLabel = loopy.model.addLabel({
			x: Mouse.x,
			y: Mouse.y+10 // whatever, to make text actually centered.
		});
		loopy.sidebar.edit(newLabel);

	};

}