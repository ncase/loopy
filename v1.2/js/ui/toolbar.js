class Toolbar {
    static get TOOL_MOVE() { return "tool-move"; };
    static get TOOL_TEXT() { return "tool-text"; };
    static get TOOL_ERASE() { return "tool-erase"; };
    static get TOOL_PEN() { return "tool-pen"; };

    static get TOOL_LINK() { return "tool-link"; };
    static get TOOL_EMBED() { return "tool-embed"; };
    static get TOOL_IMPORT() { return "tool-import"; };
    static get TOOL_EXPORT() { return "tool-export"; };

    #dom;
    #currentTool;
    #buttons = [];
    #buttonsByID = {};

    get currentTool() { return this.#currentTool; };

    constructor(dom) {
        _validateAssigned(dom, "Toolbar DOM must be provided.");

        this.#dom = dom

        // add buttons
        this.#addButton({
            id: Toolbar.TOOL_MOVE,
            class: "gg-controller",
            tooltip: "(M)ove",
            selectable: true,
        });
        this.#addButton({
            id: Toolbar.TOOL_PEN,
            class: "gg-pen",
            tooltip: "(P)en",
            selectable: true,
        });
        this.#addButton({
            id: Toolbar.TOOL_TEXT,
            class: "gg-text",
            tooltip: "(T)ext",
            selectable: true,
        });
        this.#addButton({
            id: Toolbar.TOOL_ERASE,
            class: "gg-erase",
            tooltip: "(E)rase",
            selectable: true,
        });

        this.#addHTML({
            html: "<hr/>"
        });

        this.#addButton({
            id: Toolbar.TOOL_LINK,
            class: "gg-link",
            tooltip: "(1) Save as link",
            callback: function () { publish("modal", [Toolbar.TOOL_LINK]); }.bind(this)
        });
        this.#addButton({
            id: Toolbar.TOOL_EMBED,
            class: "gg-code-slash",
            tooltip: "(2) Embed",
            callback: function () { publish("modal", [Toolbar.TOOL_EMBED]); }.bind(this)
        });
        this.#addButton({
            id: Toolbar.TOOL_IMPORT,
            class: "gg-import",
            tooltip: "(3) Import File",
            callback: function () { publish("import/file"); }.bind(this)
        });
        this.#addButton({
            id: Toolbar.TOOL_EXPORT,
            class: "gg-export",
            tooltip: "(4) Export File",
            callback: function () { publish("export/file"); }.bind(this)
        });

        this.#setCurrentTool(Toolbar.TOOL_MOVE);
    }

    //**********************************************************************/
    // PUBLIC METHODS
    /**********************************************************************/
    hide() {
        this.#dom.style.display = "none";
    }

    onButtonClick(configuration) {
        if (configuration.selectable) {
            this.#setCurrentTool(configuration.id);
        }
        if (configuration.callback) {
            configuration.callback();
        }
    }

    show() {
        this.#dom.style.display = "block";
    }

    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #addButton(configuration) {
        // add the button
        var button = new ToolbarButton(this, configuration);
        this.#dom.appendChild(button.dom);
        this.#buttons.push(button);
        this.#buttonsByID[configuration.id] = button;

        // shortcut
        subscribe("key/" + configuration.id.replace("tool-", ""), function () {
            this.onButtonClick(configuration);
        }.bind(this));
    };

    #addHTML(configuration) {
        // add the button
        var html = new ComponentHTML(this, "", configuration);
        this.#dom.appendChild(html.dom);
    }

    #setCurrentTool(tool) {
        this.#currentTool = tool;
        for (var i = 0; i < this.#buttons.length; i++) {
            this.#buttons[i].deselect();
        }
        this.#buttonsByID[tool].select();

        publish("tool/changed", [tool]);
    };
}

class ToolbarButton {
    #dom;
    #selectable;

    get dom() { return this.#dom; };

    constructor(toolbar, configuration) {
        this.id = configuration.id;
        this.#selectable = configuration.selectable;
        this.#dom = document.createElement("div");
        this.#dom.setAttribute("class", "toolbar-button");

        var i = document.createElement("i");
        i.setAttribute("class", configuration.class);
        this.#dom.appendChild(i);

        // tooltip
        this.#dom.setAttribute("data-balloon", configuration.tooltip);
        this.#dom.setAttribute("data-balloon-pos", "right");

        // on click
        this.#dom.onclick = function () {
            toolbar.onButtonClick(configuration);
        };
    }

    select() {
        this.#dom.setAttribute("selected", "yes");
    };

    deselect() {
        this.#dom.setAttribute("selected", "no");
    };
}