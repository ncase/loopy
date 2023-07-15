class UI {

	#dom;
	#pages;
	#currentPage;

	get currentPage() { return this.#currentPage; }

	constructor(dom) {
		this.#dom = dom;
		this.#pages = [];
		this.#currentPage = null;
	}

	addPage(id, page) {
		page.id = id;
		this.#dom.appendChild(page.dom);
		this.#pages.push(page);
	};

	hide() {
		this.#dom.style.display = "none";
	}

	show() {
		this.#dom.style.display = "block";
	}

	showPage(id) {
		var shownPage = null;
		for (var i = 0; i < this.#pages.length; i++) {
			var page = this.#pages[i];
			if (page.id == id) {
				page.show();
				shownPage = page;
			} else {
				page.hide();
			}
		}
		return this.#currentPage = shownPage;
	};

	removeAttribute(key) {
		this.#dom.removeAttribute(key);
	}

	setAttribute(key, value) {
		this.#dom.setAttribute(key, value);
	}
}

class UIPage {
	#dom;

	components;
	componentsByID;
	configuration;

	get dom() { return this.#dom; }

	constructor(configuration) {
		this.#dom = document.createElement("div");

		this.components = [];
		this.componentsByID = {};
		this.configuration = configuration;
	}

	addComponent(component) {
		this.#dom.appendChild(component.dom);
		this.components.push(component);
		this.componentsByID[component.targetPropertyName] = component;
		return component;
	};

	getComponent(id) {
		return this.componentsByID[id];
	};

	removeAttribute(key) {
		this.#dom.removeAttribute(key);
	}

	setAttribute(key, value) {
		this.#dom.setAttribute(key, value);
	}

	show() {
		this.#dom.style.display = "block";
		this.onShow();
	};

	hide() {
		this.#dom.style.display = "none";
		this.onHide();
	};

	onHide() { }

	onShow() { }
}

class Component {
	#dom;
	#page;
	#configuration;
	#targetPropertyName;

	constructor(page, targetPropertyName, configuration) {
		this.#page = page;
		this.#targetPropertyName = targetPropertyName;
		this.#configuration = configuration;

		this.#dom = document.createElement("div");
	}

	get dom() { return this.#dom; };
	get page() { return this.#page; };
	get targetPropertyName() { return this.#targetPropertyName; };
	get configuration() { return this.#configuration; };

	getTargetPropertyValue() {
		return this.page.target[this.targetPropertyName];
	};

	setTargetPropertyValue(value) {
		this.page.target[this.targetPropertyName] = value;
		this.page.onEdit();

		publish("model/changed");
	};

	show() { _throwErrorMessage("Not implemented!"); }
}

class ComponentButton extends Component {
	constructor(page, targetPropertyName, configuration) {
		super(page, targetPropertyName, configuration);

		var button = _createButton(this.configuration.label, function () {
			configuration.onclick(this.page.target);
		}.bind(this));

		this.dom.appendChild(button);

		// Unless it's a HEADER button!
		if (this.configuration.header) {
			button.setAttribute("header", "yes");
		}
	}

	show() { }
}

class ComponentHTML extends Component {
	constructor(page, targetPropertyName, configuration) {
		super(page, targetPropertyName, configuration);

		this.dom.innerHTML = this.configuration.html;
	}

	show() { }
}

class ComponentInput extends Component {
	#input;

	constructor(page, targetPropertyName, configuration) {
		super(page, targetPropertyName, configuration);

		// label
		var label = _createLabel(configuration.label);
		var className = configuration.textarea ? "component-textarea" : "component-input";
		this.dom.appendChild(label);

		// input
		this.#input = _createTextInput(className, configuration.textarea, function (event) {
			this.setTargetPropertyValue(this.#input.value);
		}.bind(this));

		this.dom.appendChild(this.#input);
	}

	show() {
		this.#input.value = this.getTargetPropertyValue();
	};

	select() {
		setTimeout(function () { this.#input.select(); }.bind(this), 10);
	};
}

class ComponentOutput extends Component {
	#output;

	constructor(page, targetPropertyName, configuration) {
		super(page, targetPropertyName, configuration);

		this.#output = _createTextInput("component-output", configuration.textarea, configuration.oninput);
		this.#output.setAttribute("readonly", "true");
		this.#output.onclick = function () {
			this.#output.select();
		}.bind(this);

		this.dom.appendChild(this.#output);
	}

	getOutputElement() {
		return this.#output;
	}

	output(value) {
		this.#output.value = value;
	};

	select() {
		this.#output.select();
	}
}

class ComponentIframe extends Component {
	#iframe;

	constructor(page, targetPropertyName, configuration) {
		super(page, targetPropertyName, configuration);

		this.#iframe = document.createElement("iframe");
		this.#iframe.width = configuration.width;
		this.#iframe.height = configuration.height;

		this.dom.appendChild(this.#iframe);
	}

	getIframeElement() {
		return this.#iframe;
	}

}