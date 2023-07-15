class Loopy {
    static get #DEFAULT_ANIMATION_SPEED() { return 3; };
    static get #INITIAL_WOBBLE_CONTROLS() { return -1; };

    #configuration;
    #padding = { all: 25, bottom: 110 };
    #fps = 1000 / 30; // 30 FPS

    #wobble = Loopy.#INITIAL_WOBBLE_CONTROLS;
    #elements = {};

    constructor(dom, configuration) {
        Loopy.#registerGlobalParameters();

        _validateAssigned(dom, "Parent dom to build the simulator must be provided in the configuration.");
        _validateAssigned(configuration, "Configuration object must be provided.");

        // configuration
        this.#configuration = configuration;
        Loopy.#initializeConfigurationParameter(this.#configuration, "embedded", false, Loopy.#booleanParser, Loopy.#booleanTypeChecker);
        Loopy.#initializeConfigurationParameter(this.#configuration, "ui", true, Loopy.#booleanParser, Loopy.#booleanTypeChecker);
        Loopy.#initializeConfigurationParameter(this.#configuration, "autoSignal", true, Loopy.#arrayParser, Array.isArray);
        Loopy.#initializeConfigurationParameter(this.#configuration, "animationSpeed", Loopy.#DEFAULT_ANIMATION_SPEED, parseInt, parameter => typeof parameter == "number");

        // initialize parameters
        var offset = { x: 0, y: 0, scale: 1 }
        if (this.#configuration.embedded && !this.#configuration.ui) {
            this.#padding.bottom = this.#padding.all;
        }

        // initialize html elements
        this.#createHTMLElements(dom);

        // mouse
        this.mouse = new Mouse(this.#elements.simulator, {
            offset: offset,
            padding: this.#padding,
            embedded: this.#configuration.embedded
        });

        // model
        this.model = new Model(this.#elements.simulator, this.mouse, {
            initialMode: Model.MODE_COMPOSE,
            offset: offset,
            padding: this.#padding,
            embedded: this.#configuration.embedded
        });

        // toolbar, sidebar & playbar
        this.toolbar = new Toolbar(this.#elements.toolbar);
        this.sidebar = new Sidebar(this.#elements.sidebar);
        this.playbar = new Playbar(this.#elements.playbar, this.#createPlaybarConfiguration());
        this.modal = new Modal(this.#elements.modal, this.#createModalConfiguration());

        this.#registerTextTool();
        this.#registerEraseTool();
        this.#registerMoveTool();
        this.#registerPenTool();

        subscribe("resize", function () { this.model.center(this.#configuration.embedded) }.bind(this));
        subscribe("export/file", function () { this.#saveToFile() }.bind(this));
        subscribe("import/file", function () { this.#loadFromFile() }.bind(this));

        subscribe("model/mode/changed", function () {
            if (this.model.isPlaying()) {
                this.#wobble = 45;
                this.playbar.showPage(Playbar.PAEG_ID_PLAY);
                this.sidebar.showPage(Sidebar.PAGE_ID_DEFAULT);
                this.sidebar.setAttribute("mode", "play");
                this.toolbar.hide();
                this.#elements.simulator.removeAttribute("cursor");
            } else if (this.model.isComposing()) {
                this.#wobble = -1;
                this.playbar.showPage(Playbar.PAGE_ID_COMPOSE);
                this.sidebar.showPage(Sidebar.PAGE_ID_DEFAULT);
                this.sidebar.setAttribute("mode", "compose");
                this.toolbar.show();
                this.#elements.simulator.setAttribute("cursor", this.toolbar.currentTool);
            }
        }.bind(this));
    }

    run() {
        setInterval(function () {
            this.mouse.update();
            if (this.#wobble >= 0) { // wobble
                this.#wobble--;
            }
            if (!this.modal.open) {
                this.model.update(this.#getAnimationConfiguration());
            }
        }.bind(this), this.#fps);

        this.#loadFromURL(); // try to load from URL

        if (this.#configuration.embedded) {
            // hide compose functionality
            this.toolbar.hide();
            this.sidebar.hide();
            if (!this.#configuration.ui) {
                this.playbar.hide()
            }

            // fullscreen canvas
            this.#elements.simulator.setAttribute("fullscreen", "yes");
            this.#elements.playbar.setAttribute("fullscreen", "yes");

            // autoplay
            this.model.setMode(Model.MODE_PLAY);
            this.model.autoSignal(this.#configuration.autoSignal);
        } else {
            // show edit functionality
            this.toolbar.show();
            this.sidebar.show();
            this.playbar.show();
        }

        publish("resize");

        // display the body now
        this.#elements.container.setAttribute("style", "opacity:100")

        requestAnimationFrame(this.#draw.bind(this));
    }

    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #createHTMLElements(container) {
        this.#elements.container = container;
        this.#elements.container.setAttribute("style", "opacity:0")

        // create simulator dom
        this.#elements.simulator = document.createElement("div");
        this.#elements.simulator.setAttribute("id", "simulator")

        // create playbar dom
        this.#elements.playbar = document.createElement("div");
        this.#elements.playbar.setAttribute("id", "playbar")

        // create sidebar dom
        this.#elements.sidebar = document.createElement("div");
        this.#elements.sidebar.setAttribute("id", "sidebar")

        // create toolbar dom
        this.#elements.toolbar = document.createElement("div");
        this.#elements.toolbar.setAttribute("id", "toolbar")

        // create toolbar dom
        this.#elements.modal = document.createElement("div");
        this.#elements.modal.setAttribute("id", "modal-container")

        this.#elements.container.appendChild(this.#elements.simulator);
        this.#elements.container.appendChild(this.#elements.playbar);
        this.#elements.container.appendChild(this.#elements.sidebar);
        this.#elements.container.appendChild(this.#elements.toolbar);
        this.#elements.container.appendChild(this.#elements.modal);
    }

    #createModalConfiguration() {
        return {
            saveToURL: function (action) { return this.#saveToURL(action); }.bind(this),
        }
    }

    #createPlaybarConfiguration() {
        return {
            embedded: this.#configuration.embedded,
            isComposing: this.model.isComposing.bind(this.model),
            isPlaying: this.model.isPlaying.bind(this.model),
            play: function () { this.setMode(Model.MODE_PLAY) }.bind(this.model),
            compose: function () { this.setMode(Model.MODE_COMPOSE) }.bind(this.model),
            getAnimationSpeed: function () { return this.#configuration.animationSpeed }.bind(this),
            setAnimationSpeed: function (animationSpeed) { this.#configuration.animationSpeed = animationSpeed }.bind(this),
            saveToURL: function (action) { return this.#saveToURL(action); }.bind(this),
        }
    }

    #draw() {
        if (!this.modal.open) {
            this.model.draw(this.#getAnimationConfiguration());
        }
        requestAnimationFrame(this.#draw.bind(this));
    }

    #getAnimationConfiguration() {
        return {
            wobble: this.#wobble,
            animationSpeed: this.#configuration.animationSpeed
        };
    }

    #getEdgeSelectionRadius() {
        // radius to use for select 
        if (this.toolbar.currentTool == Toolbar.TOOL_MOVE || this.toolbar.currentTool != Toolbar.TOOL_PEN) return 40; // selecting, wide radius!
        else if (this.toolbar.currentTool == Toolbar.TOOL_ERASE) return 25; // no accidental erase
        else return 15; // add text close to edges
    }

    #loadFromFile() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = readerEvent => {
                var data = readerEvent.target.result;
                this.model.deserialize(this.#getAnimationConfiguration(), data);
            }
        };
        input.click();
    };

    #loadFromURL() {
        var data = _getParameterByName("data");
        if (data) {
            this.model.deserialize(this.#getAnimationConfiguration(), data);
        }
    };

    #saveToFile() {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + this.model.serialize());
        element.setAttribute('download', "model.loopy");
        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        this.model.dirty = false;
    }

    #saveToURL(action) {
        this.model.dirty = false;
        var data = this.model.serialize();

        var link = window.location.origin + window.location.pathname + "?";
        link += "data=" + data

        window.history.replaceState(null, null, link);

        if (action == Toolbar.TOOL_EMBED) {
            link += "&embedded=1"
        }

        return link;
    }

    #selectItemToEdit() {
        if (!this.model.isComposing()) return true;

        // Did user click on a text ? If so, edit THAT text.
        var clickedText = this.model.getTextByCoordinates(this.mouse.x, this.mouse.y, 0);
        if (clickedText) {
            this.sidebar.edit(clickedText);
            return true;
        }

        // Did user click on a node ? If so, edit THAT node.
        var clickedEdge = this.model.getNodeByCoordinates(this.mouse.x, this.mouse.y, 0);
        if (clickedEdge) {
            this.sidebar.edit(clickedEdge);
            return true;
        }

        // Did user click on an edge ? If so, edit THAT edge.
        var clickedEdge = this.model.getEdgeByCoordinates(this.mouse.x, this.mouse.y, this.#getEdgeSelectionRadius());
        if (clickedEdge) {
            this.sidebar.edit(clickedEdge);
            return true;
        }
        return false;
    }

    #registerTextTool() {
        // subscriptions
        subscribe("mouseclick", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_TEXT) return;
            if (this.#selectItemToEdit()) return;

            if (this.sidebar.currentPage.id != Sidebar.PAGE_ID_TEXT) {
                var newText = this.model.addText(this.#getAnimationConfiguration(), {
                    x: this.mouse.x,
                    y: this.mouse.y + 10, // to make text actually centered
                    value: "Add your text here"
                });
                this.sidebar.edit(newText);
                return;
            }
            this.sidebar.showPage(Sidebar.PAGE_ID_DEFAULT);
        }.bind(this));
    }

    #registerEraseTool() {
        var erase = function (clicked) {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_ERASE) return;

            if (this.mouse.pressed || clicked) {
                var text = this.model.getTextByCoordinates(this.mouse.x, this.mouse.y, 0);
                if (text) text.kill();

                var node = this.model.getNodeByCoordinates(this.mouse.x, this.mouse.y, 0);
                if (node) node.kill();

                var edge = this.model.getEdgeByCoordinates(this.mouse.x, this.mouse.y, this.#getEdgeSelectionRadius());
                if (edge) edge.kill();
            }
        }.bind(this);

        subscribe("mousemove", function () { erase(); }.bind(this));
        subscribe("mouseclick", function () { erase(true); }.bind(this));
    }

    #registerMoveTool() {
        var dragging, offset = { x: 0, y: 0 };
        // subscriptions
        subscribe("mouseclick", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_MOVE) return;
            if (this.#selectItemToEdit()) return;
            this.sidebar.showPage(Sidebar.PAGE_ID_DEFAULT);
        }.bind(this));

        subscribe("mousedown", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_MOVE) return;

            var text = this.model.getTextByCoordinates(this.mouse.x, this.mouse.y, 0);
            if (text) {
                dragging = text;
                offset.x = this.mouse.x - text.x;
                offset.y = this.mouse.y - text.y;
                this.sidebar.edit(text);
                publish("tool/changed", [Toolbar.TOOL_MOVE, true])
                return;
            }

            var node = this.model.getNodeByCoordinates(this.mouse.x, this.mouse.y, 0);
            if (node) {
                dragging = node;
                offset.x = this.mouse.x - node.x;
                offset.y = this.mouse.y - node.y;
                this.sidebar.edit(node);
                publish("tool/changed", [Toolbar.TOOL_MOVE, true])
                return;
            }

            var edge = this.model.getEdgeByCoordinates(this.mouse.x, this.mouse.y, this.#getEdgeSelectionRadius());
            if (edge) {
                dragging = edge;
                offset.x = this.mouse.x - edge.x;
                offset.y = this.mouse.y - edge.y;
                this.sidebar.edit(edge);
                publish("tool/changed", [Toolbar.TOOL_MOVE, true])
                return;
            }

        }.bind(this));

        subscribe("mousemove", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_MOVE) return;
            if (dragging) {
                dragging.move(this.mouse.x - offset.x, this.mouse.y - offset.y);

                this.model.update(this.#getAnimationConfiguration()); // update to have no visual glitches

                publish("model/changed");
            }
        }.bind(this));

        subscribe("mouseup", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_MOVE) return;
            publish("tool/changed", [Toolbar.TOOL_MOVE])
            dragging = null;
            offset.x = 0;
            offset.y = 0;
        }.bind(this));
    }

    #registerPenTool() {
        subscribe("mouseclick", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_PEN) return;
            this.model.removeStroke();
            if (this.#selectItemToEdit()) return;
            this.sidebar.showPage(Sidebar.PAGE_ID_DEFAULT);
        }.bind(this));

        subscribe("mousedown", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_PEN) return;

            this.model.addStroke([this.mouse.x, this.mouse.y]);
            this.model.draw(this.#getAnimationConfiguration());
        }.bind(this));

        subscribe("mousemove", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_PEN) return;
            this.model.draw(this.#getAnimationConfiguration());
        }.bind(this));

        subscribe("mouseup", function () {
            if (!this.model.isComposing() || this.toolbar.currentTool != Toolbar.TOOL_PEN) return;
            var stroke = this.model.getStroke();

            if (!stroke || stroke.length < 2) return;
            if (!this.mouse.moved) return;

            // detect which item draw
            // if started in a node and ended near/in a node, it is an edge else it is a node
            var startPoint = stroke[0];
            var sourceNode = this.model.getNodeByCoordinates(startPoint[0], startPoint[1], 0);
            if (!sourceNode) sourceNode = this.model.getNodeByCoordinates(startPoint[0], startPoint[1], 20); // try again with buffer

            var endPoint = stroke[stroke.length - 1];
            var targetNode = this.model.getNodeByCoordinates(endPoint[0], endPoint[1], 0);
            if (!targetNode) targetNode = this.model.getNodeByCoordinates(endPoint[0], endPoint[1], 40); // try again with buffer

            if (sourceNode && targetNode) { // add edge
                var edgeConfiguration = { source: sourceNode, target: targetNode }
                if (sourceNode == targetNode) {
                    // find rotation first by getting average point
                    var bounds = _getBounds(stroke);
                    var x = (bounds.left + bounds.right) / 2;
                    var y = (bounds.top + bounds.bottom) / 2;
                    var dx = x - sourceNode.x;
                    var dy = y - sourceNode.y;
                    var angle = Math.atan2(dy, dx);

                    // find arc height.
                    var translated = _translatePoints(stroke, -sourceNode.x, -sourceNode.y);
                    var rotated = _rotatePoints(translated, -angle);
                    bounds = _getBounds(rotated);

                    // arc & rotation
                    edgeConfiguration.rotation = angle * (360 / Math.TAU) + 90;
                    edgeConfiguration.arc = bounds.right;


                    // if the arc is NOT greated than the radius, don't draw, and otherwise, make sure minimum distance of radius+25)
                    if (edgeConfiguration.arc < sourceNode.radius) {
                        edgeConfiguration = null;
                        this.sidebar.edit(sourceNode); // you were probably trying to edit the node
                    } else {
                        var minimum = sourceNode.radius + 25;
                        if (edgeConfiguration.arc < minimum) edgeConfiguration.arc = minimum;
                    }
                } else {
                    // find the arc by translating & rotating
                    var dx = targetNode.x - sourceNode.x;
                    var dy = targetNode.y - sourceNode.y;
                    var angle = Math.atan2(dy, dx);
                    var translated = _translatePoints(stroke, -sourceNode.x, -sourceNode.y);
                    var rotated = _rotatePoints(translated, -angle);
                    var bounds = _getBounds(rotated);

                    // arc
                    if (Math.abs(bounds.top) > Math.abs(bounds.bottom)) {
                        edgeConfiguration.arc = -bounds.top;
                    } else {
                        edgeConfiguration.arc = -bounds.bottom;
                    }
                }

                if (edgeConfiguration) {
                    var newEdge = this.model.addEdge(this.#getAnimationConfiguration(), edgeConfiguration);
                    this.sidebar.edit(newEdge);
                }
            } else if (!sourceNode) { // add node
                var bounds = _getBounds(stroke);
                var x = (bounds.left + bounds.right) / 2;
                var y = (bounds.top + bounds.bottom) / 2;
                var r = ((bounds.width / 2) + (bounds.height / 2)) / 2;

                if (r > 15) { // stroke cannot be too small
                    var newNode = this.model.addNode(this.#getAnimationConfiguration(), {
                        x: x,
                        y: y
                    });
                    this.sidebar.edit(newNode);
                }
            }

            this.model.removeStroke();
        }.bind(this));
    }
    /**********************************************************************/
    // PRIVATE STATIC METHODS
    /**********************************************************************/
    static #arrayParser(parameter) {
        if (parameter && (parameter = JSON.parse(parameter)) && Array.isArray(parameter)) {
            return parameter;
        }
        return null;
    }

    static #booleanParser(parameter) {
        return !!parseInt(parameter);
    }

    static #booleanTypeChecker(parameter) {
        return typeof parameter == "boolean";
    }

    static #initializeConfigurationParameter(configuration, parameterName, defaultValue, parser, validator) {
        var parameter = _getParameterByName(parameterName);
        if (parameter) {
            configuration[parameterName] = parser(parameter)
        } else {
            parameter = configuration[parameterName];
            if (parameter !== undefined) {
                if (validator(parameter)) return;
                configuration[parameterName] = parser(parameter)
            } else {
                configuration[parameterName] = defaultValue;
            }
        }
    }

    static #registerGlobalParameters(model) {
        window.HIGHLIGHT_COLOR = "rgba(193, 220, 255, 0.6)";
        window.onresize = function () {
            publish("resize");
        };

        Math.TAU = Math.PI * 2;
        window.isMacLike = navigator.userAgent.indexOf("Mac") != -1 || navigator.userAgent.indexOf("like Mac") != -1

        window.onbeforeunload = function (e) {
            if (window.Loopy && window.loopy.model && window.loopy.model.dirty) {
                var dialogText = "Are you sure you want to leave without saving your changes?";
                e.returnValue = dialogText;
                return dialogText;
            }
        };
    }
}