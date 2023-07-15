class Sidebar extends UI {
    static get #BACK_BUTTON_TEXT() { return "go back" };

    static get PAGE_ID_DEFAULT() { return "DEFAULT" };
    static get PAGE_ID_NODE() { return "NODE" };
    static get PAGE_ID_EDGE() { return "EDGE" };
    static get PAGE_ID_TEXT() { return "TEXT" };


    constructor(dom) {
        super(dom)

        this.addPage(Sidebar.PAGE_ID_DEFAULT, this.#initializeDefaultPage());
        this.addPage(Sidebar.PAGE_ID_NODE, this.#initializeNodeEditPage());
        this.addPage(Sidebar.PAGE_ID_EDGE, this.#initializeEdgeEditPage());
        this.addPage(Sidebar.PAGE_ID_TEXT, this.#initializeTextEditPage());

        this.showPage(Sidebar.PAGE_ID_DEFAULT);

        // go back to main when editing is killed
        subscribe("kill", function (item) {
            if (this.currentPage.target == item) {
                this.showPage(Sidebar.PAGE_ID_DEFAULT);
            }
        }.bind(this));
    }

    edit(object) {
        this.showPage(object.type);
        this.currentPage.edit(object);
    };

    #initializeNodeEditPage() {
        var page = new SidebarPage();
        page.addComponent(new ComponentButton(page, "", {
            header: true,
            label: Sidebar.#BACK_BUTTON_TEXT,
            onclick: function () { this.showPage(Sidebar.PAGE_ID_DEFAULT); }.bind(this)
        }));
        page.addComponent(new ComponentInput(page, "label", {
            label: "<br><br>Name:"
        }));
        page.addComponent(new ComponentSlider(page, "hue", {
            bg: "color",
            label: "Color:",
            options: [0, 1, 2, 3, 4, 5],
            oninput: function (value) { Node.DEFAULT_HUE = value; }
        }));
        page.addComponent(new ComponentSlider(page, "initialValue", {
            bg: "initial",
            label: "Start Amount:",
            options: [0, 0.16, 0.33, 0.50, 0.66, 0.83, 1],
            oninput: function (value) { Node.DEFAULT_HUE = value; }

        }));
        page.addComponent(new ComponentButton(page, "", {
            label: "delete node",
            onclick: function (node) {
                node.kill();
                this.showPage(Sidebar.PAGE_ID_DEFAULT);
            }.bind(this)
        }));

        page.onEdit = function () {
            var node = page.target;
            var color = node.color;
            page.getComponent("initialValue").setBGColor(color);

            var name = node.label;
            if (name == "" || name == "?") page.getComponent("label").select();
        };
        return page;
    }

    #initializeEdgeEditPage() {
        var page = new SidebarPage();
        page.addComponent(new ComponentButton(page, "", {
            header: true,
            label: Sidebar.#BACK_BUTTON_TEXT,
            onclick: function () { this.showPage(Sidebar.PAGE_ID_DEFAULT); }.bind(this)
        }));
        page.addComponent(new ComponentSlider(page, "strength", {
            bg: "strength",
            label: "<br><br>Relationship:",
            options: [1, -1],
            oninput: function (value) { Edge.DEFAULT_STRENGTH = value; }
        }));
        page.addComponent(new ComponentHTML(page, "", {
            html: "(to make a stronger relationship, draw multiple arrows!) <br><br>(to make a delayed relationship, draw longer arrows)"
        }));
        page.addComponent(new ComponentButton(page, "", {
            label: "delete edge",
            onclick: function (edge) {
                edge.kill();
                this.showPage(Sidebar.PAGE_ID_DEFAULT);
            }.bind(this)
        }));
        return page;
    }

    #initializeTextEditPage() {
        var page = new SidebarPage();
        page.addComponent(new ComponentButton(page, "", {
            header: true,
            label: Sidebar.#BACK_BUTTON_TEXT,
            onclick: function () { this.showPage(Sidebar.PAGE_ID_DEFAULT); }.bind(this)
        }));
        page.addComponent(new ComponentInput(page, "value", {
            label: "<br><br>Label:",
            textarea: true
        }));
        page.addComponent(new ComponentButton(page, "", {
            label: "delete label",
            onclick: function (item) {
                item.kill();
                this.showPage(Sidebar.PAGE_ID_DEFAULT);
            }.bind(this)
        }));

        page.onShow = function () {
            page.getComponent("value").select();
        };

        page.onHide = function () {
            var label = page.target;
            if (!page.target) return;

            var text = label.text;
            if (/^\s*$/.test(text)) {
                page.target = null;
                label.kill();
            }
        };

        return page;
    }

    #initializeDefaultPage() {
        var page = new SidebarPage();
        page.addComponent(new ComponentHTML(page, "", {
            html: "" +
                "<b style='font-size:1.4em'>LOOPY</b> (v1.2)<br>a tool for thinking in systems<br><br>" +

                "<span class='mini_button' onclick='publish(\"modal\",[\"examples\"])'>see examples</span> " +
                "<span class='mini_button' onclick='publish(\"modal\",[\"howto\"])'>how to</span> " +
                "<span class='mini_button' onclick='publish(\"modal\",[\"credits\"])'>credits</span><br><br>" +

                "<hr/><br>"+
				
                "<a target='_blank' href='../'>LOOPY</a> is "+
                "made by <a target='_blank' href='http://ncase.me'>nicky case</a> "+
                "with your support <a target='_blank' href='https://www.patreon.com/ncase'>on patreon</a> &lt;3<br><br>"+
                "<span style='font-size:0.85em'>P.S: go read <a target='_blank' href='https://www.amazon.com/Thinking-Systems-Donella-H-Meadows/dp/1603580557'>Thinking In Systems</a>, thx</span>"
    
        }));
        return page;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////
// COMPONENTS ///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
class SidebarPage extends UIPage {
    #target;

    get target() { return this.#target; }

    constructor() {
        super();
        this.#target = null;

        // start hiding
        this.hide();
    }

    addComponent(component) {
        super.addComponent(component);
    };

    edit(item) {
        if (this.target) {
            this.target.selected = false;
        }

        // new target to edit
        this.#target = item;
        this.target.selected = true;

        // show each property with its component
        for (var i = 0; i < this.components.length; i++) {
            this.components[i].show();
        }

        // callback
        this.onEdit();
    };

    hide() {
        super.hide();
        if (this.target) {
            this.target.selected = false;
        }
    };

    onEdit() { }
}

class ComponentSlider extends Component {
    constructor(page, propertyName, configuration) {
        super(page, propertyName, configuration);

        this.isDragging = false;

        // Slider DOM: graphic + pointer
        this.slider = new Image();
        this.slider.draggable = false;
        this.slider.src = "img/sliders/" + configuration.bg + ".png";
        this.slider.setAttribute("class", "component-slider-graphic");

        this.pointer = new Image();
        this.pointer.draggable = false;
        this.pointer.src = "img/sliders/slider_pointer.png";
        this.pointer.setAttribute("class", "component-slider-pointer");

        var sliderDOM = document.createElement("div");
        sliderDOM.setAttribute("class", "component-slider");
        sliderDOM.appendChild(this.slider);
        sliderDOM.appendChild(this.pointer);

        var label = _createLabel(this.configuration.label);
        this.dom.appendChild(label);
        this.dom.appendChild(sliderDOM);

        _addMouseEvents(this.slider, this);
    }

    movePointer() {
        var value = this.getTargetPropertyValue();
        var optionIndex = this.configuration.options.indexOf(value);
        var x = (optionIndex + 0.5) * (250 / this.configuration.options.length);
        this.pointer.style.left = (x - 7.5) + "px";
    };

    onMouseDown(event) {
        this.isDragging = true;
        this.sliderInput(event);
    };

    onMouseUp() {
        this.isDragging = false;
    };

    onMouseMove(event) {
        if (this.isDragging) {
            this.sliderInput(event);
        }
    };

    sliderInput(event) {
        // What's the option?
        var index = event.x / 250;
        var optionIndex = Math.floor(index * this.configuration.options.length);
        var option = this.configuration.options[optionIndex];
        if (option === undefined) return;
        this.setTargetPropertyValue(option);

        if (this.configuration.oninput) {
            this.configuration.oninput(option);
        }

        this.movePointer();
    };

    show() {
        this.movePointer();
    };

    setBGColor(color) {
        this.slider.style.background = color;
    };
}


