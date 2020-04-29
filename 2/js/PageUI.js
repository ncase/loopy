/**********************************

PAGE UI: to extend to Sidebar, Play Controls, Modal.

**********************************/

function PageUI(dom){

	const self = this;
	self.dom = dom;

	self.pages = [];
	self.addPage = function(id, page){
		page.id = id;
		self.dom.appendChild(page.dom);
		self.pages.push(page);
	};
	self.currentPage = null;
	self.showPage = function(id){
		let shownPage = null;
		for(let i=0; i<self.pages.length; i++){
			let page = self.pages[i];
			if(page.id===id){
				page.show();
				shownPage = page;
			}else{
				page.hide();
			}
		}
		self.currentPage = shownPage;
		return shownPage;
	};

}

function Page(){

	const self = this;

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