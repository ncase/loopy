class Modal extends UI {
    static get EXAMPLES() { return "examples"; }
    static get HOW_TO() { return "howto"; }
    static get CREDITS() { return "credits"; }

    #elements = {};
    #open = false;

    get open() { return this.#open; }

    constructor(dom, configuration) {
        var content = document.createElement("div");

        super(content)

        this.#createHTMLElements(dom, content);

        this.addPage(Toolbar.TOOL_LINK, this.#initializeSaveAsLinkPage(configuration));
        this.addPage(Toolbar.TOOL_EMBED, this.#initializeEmbedCodePage(configuration));
        this.addPage(Modal.EXAMPLES, this.#initializeExamplesPage(configuration));
        this.addPage(Modal.HOW_TO, this.#initializeHowToPage(configuration));
        this.addPage(Modal.CREDITS, this.#initializeCreditsPage(configuration));

        subscribe("modal", function (action) {
            var page = this.showPage(action);
            if (!page) return;

            if (page.onshow) page.onshow();
            this.show();
        }.bind(this));
    }

    //**********************************************************************/
    // PUBLIC METHODS
    /**********************************************************************/
    hide() {
        super.hide();
        this.#elements.container.setAttribute("show", "no");
        if (this.currentPage.onhide) this.currentPage.onhide();
        this.#open = false;
    };

    show() {
        super.show();
        this.#elements.container.setAttribute("show", "yes");
        this.#open = true;
    };
    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #createHTMLElements(container, content) {
        this.#elements.container = container;

        // create background dom
        this.#elements.background = document.createElement("div");
        this.#elements.background.setAttribute("id", "modal-background")
        this.#elements.background.onclick = function () { this.hide(); }.bind(this);

        // create body dom
        this.#elements.body = document.createElement("div");
        this.#elements.body.setAttribute("id", "modal-body")

        // create close button dom
        this.#elements.close = document.createElement("div");
        this.#elements.close.setAttribute("id", "modal-close")
        this.#elements.close.innerHTML = "[X] CLOSE"
        this.#elements.close.onclick = function () { this.hide(); }.bind(this);
        this.#elements.body.appendChild(this.#elements.close);

        // create content dom
        this.#elements.content = content;
        this.#elements.content.setAttribute("id", "modal-content")
        this.#elements.body.appendChild(this.#elements.content);

        this.#elements.container.appendChild(this.#elements.background);
        this.#elements.container.appendChild(this.#elements.body);
    }

    #initializeEmbedCodePage(configuration) {
        var page = new ModalPage();

        var link;
        var __onUpdate = function () {
            var embedCode = '<iframe width="%s" height="%s" frameborder="%s" src="%s"></iframe>';
            embedCode = _format(embedCode, widthInput.getValue(), heightInput.getValue(), 0, link);

            output.output(embedCode);
        };

        var sidebar = document.createElement("div");
        sidebar.style.width = "200px";
        sidebar.style.height = "500px";
        sidebar.style.float = "left";
        page.dom.appendChild(sidebar);

        // label 1
        var label = document.createElement("div");
        label.innerHTML = "<br>PREVIEW &rarr;<br><br>";
        sidebar.appendChild(label);

        // label 2
        var label = document.createElement("div");
        label.style.fontSize = "15px";
        label.innerHTML = "what size do you want your embed to be?";
        sidebar.appendChild(label);

        // edit size
        var widthInput = _createNumberInput(__onUpdate);
        var heightInput = _createNumberInput(__onUpdate);
        var label = document.createElement("div");
        label.style.display = "inline-block";
        label.style.fontSize = "15px";
        label.innerHTML = "&nbsp;X&nbsp;";
        sidebar.appendChild(widthInput.dom);
        sidebar.appendChild(label);
        sidebar.appendChild(heightInput.dom);

        // label 3
        var label = document.createElement("div");
        label.style.fontSize = "15px";
        label.innerHTML = "<br><br>copy the code below:";
        sidebar.appendChild(label);

        // result otput
        var output = new ComponentOutput(page, "", { textarea: true });
        sidebar.appendChild(output.dom);
        output.getOutputElement().style.fontSize = "12px";
        output.getOutputElement().style.height = "160px";

        // label 3
        var label = document.createElement("div");
        label.style.fontSize = "15px";
        label.style.textAlign = "left";
        label.innerHTML = "<br><br>(note: the REMIX button lets someone else, well, remix your model! don't worry, it'll just be a copy, it won't affect the original.)";
        sidebar.appendChild(label);

        var iframeContainer = page.addComponent(new ComponentIframe(page, "", {
            width: 500,
            height: 440
        }));

        iframeContainer.dom.style.float = "right";
        iframeContainer.dom.style["padding"] = "20px";

        page.onShow = function () {
            link = configuration.saveToURL(Toolbar.TOOL_EMBED);

            widthInput.setValue(500);
            heightInput.setValue(440);

            iframeContainer.getIframeElement().setAttribute("src", link);

            __onUpdate();

            output.select();
        };

        page.onHide = function () {
            iframeContainer.getIframeElement().removeAttribute("src");
        };

        return page;
    }

    #initializeExamplesPage(configuration) {
        var page = new ModalPage();
        
        var iframeContainer = page.addComponent(new ComponentIframe(page, "", {
            width: 700,
            height: 440
        }));

        iframeContainer.getIframeElement().setAttribute("src", "pages/examples/index.html");

        return page;
	}

    #initializeHowToPage(configuration) {
        var page = new ModalPage();
        
        var iframeContainer = page.addComponent(new ComponentIframe(page, "", {
            width: 530,
            height: 430
        }));

        iframeContainer.getIframeElement().setAttribute("src", "pages/howto.html");

        return page;
	}

    #initializeCreditsPage(configuration) {
        var page = new ModalPage();
        
        var iframeContainer = page.addComponent(new ComponentIframe(page, "", {
            width: 700,
            height: 430
        }));

        iframeContainer.getIframeElement().setAttribute("src", "pages/credits/index.html");

        return page;
	}

    #initializeSaveAsLinkPage(configuration) {
        var page = new ModalPage();

        page.addComponent(new ComponentHTML(page, "", {
            html: "Copy the link below: <p/>"
        }));

        var output = page.addComponent(new ComponentOutput(page, "", { textarea: true }));

        var label = document.createElement("div");
        label.style.textAlign = "right";
        label.style.fontSize = "15px";
        label.style.marginTop = "6px";
        label.style.color = "#888888";
        label.innerHTML = "(this is a long URL, so you may want to use a link-shortener like <a target='_blank' href='https://bitly.com/'>bit.ly</a>)";
        page.dom.appendChild(label);

        // chars left...
        var charactersLeft = document.createElement("div");
        charactersLeft.style.textAlign = "right";
        charactersLeft.style.fontSize = "15px";
        charactersLeft.style.marginTop = "3px";
        charactersLeft.style.color = "#888888";
        charactersLeft.innerHTML = "X out of 2048 characters";
        page.dom.appendChild(charactersLeft);

        page.onshow = function () {
            var link = configuration.saveToURL();
            output.output(link);
            output.select();

            // Chars left
            var html = link.length + " / 2048 characters";
            if (link.length > 2048) {
                html += " - MAY BE TOO LONG FOR MOST BROWSERS";
            }
            charactersLeft.innerHTML = html;
            charactersLeft.style.fontWeight = (link.length > 2048) ? "bold" : "100";
            charactersLeft.style.fontSize = (link.length > 2048) ? "14px" : "15px";
        };

        return page;
    }
}

class ModalPage extends UIPage {
    constructor(configuration) {
        super(configuration);
    }
}
