class Model {
    static get MODE_COMPOSE() { return 0; };
    static get MODE_PLAY() { return 1; };

    #texts = [];
    #nodes = [];
    #edges = [];
    #stroke = [];

    #dom;
    #canvas;
    #context;
    #embedded;
    #mode;
    #mouse;
    #padding;
    #offset;

    #dirty = false;
    #updated = false;
    #drawCountdownFull = 60; // two-second buffer
    #drawCountdown = this.#drawCountdownFull;

    get dirty() { return this.#dirty; }
    get embedded() { return this.#embedded; }

    set dirty(dirty) { return this.#dirty = dirty; }

    constructor(dom, mouse, configuration) {
        _validateAssigned(dom, "Model DOM must be provided.");
        _validateAssigned(mouse, "Mouse must be provided.");
        _validateAssigned(configuration, "Configuration object must be provided.");
        _validateAssigned(configuration.offset, "Offset information must be present in the configuration.");
        _validateAssigned(configuration.padding, "Padding information must be present in the configuration.");
        _validateTrue(configuration.initialMode === Model.MODE_COMPOSE || configuration.initialMode === Model.MODE_PLAY, "Initial mode must be present in the configuration.");
        _validateTrue(configuration.embedded !== undefined, "Embedded mode information must be present in the configuration.");

        this.#dom = dom
        this.#mouse = mouse

        this.#mode = configuration.initialMode
        this.#embedded = configuration.embedded;

        this.#offset = configuration.offset;
        this.#padding = configuration.padding;

        this.#canvas = _createCanvas(this.#dom);
        this.#context = this.#canvas.getContext("2d");

        subscribe("model/reset", function () { this.#drawCountdown = this.#drawCountdownFull; }.bind(this));
        subscribe("mousemove", function () { this.#drawCountdown = this.#drawCountdownFull; }.bind(this));
        subscribe("mousedown", function () { this.#drawCountdown = this.#drawCountdownFull; }.bind(this));
        subscribe("resize", function () { this.#drawCountdown = this.#drawCountdownFull; }.bind(this));
        subscribe("kill", function (item) { this.#removeItem(item) }.bind(this));
        subscribe("model/changed", function (source) {
            if (this.isComposing()) this.#drawCountdown = this.#drawCountdownFull;
            this.dirty = source == "stroke";
        }.bind(this));
        subscribe("tool/changed", function (tool, grabbed) {
            var postfix = grabbed ? "-grabbed" : "";
            this.#dom.setAttribute("cursor", tool + postfix);
            this.removeStroke();
        }.bind(this));
    }

    autoSignal(signal) {
        if (signal && Array.isArray(signal) && signal.length == 2) {
            var node = Node.getNode(signal[0]);
            if (node) {
                var direction = signal[1] && signal[1] > 0 ? 1 : -1;
                node.takeSignal({ delta: direction * Node.DEFAULT_SIGNAL_DELTA_MULTIPLIER });
            }
        }
    }

    center(scale) {
        if (this.#nodes.length == 0 && this.#texts.length == 0) return;

        var bounds = this.getBounds();
        var cx = (bounds.left + bounds.right) / 2;
        var cy = (bounds.top + bounds.bottom) / 2;

        if (scale) {
            var fitWidth = this.#dom.clientWidth - (2 * this.#padding.all);
            var fitHeight = this.#dom.clientHeight - this.#padding.bottom - this.#padding.all;

            this.#offset.x = (this.#padding.all + fitWidth) / 2 - cx;
            this.#offset.y = (this.#padding.all + fitHeight) / 2 - cy;

            var w = bounds.right - bounds.left;
            var h = bounds.bottom - bounds.top;
            var modelRatio = w / h;
            var screenRatio = fitWidth / fitHeight;

            // wider or taller than the screen ? wider : taller
            this.#offset.scale = modelRatio > screenRatio ? fitWidth / w : fitHeight / h;
        } else {
            var offsetX = (this.#dom.clientWidth + this.#padding.all) / 2 - cx;
            var offsetY = (this.#dom.clientHeight - this.#padding.bottom) / 2 - cy;

            // move all nodes
            for (var i = 0; i < this.#nodes.length; i++) {
                var node = this.#nodes[i];
                node.x += offsetX;
                node.y += offsetY;
            }

            // move all texts
            for (var i = 0; i < this.#texts.length; i++) {
                var text = this.#texts[i];
                text.x += offsetX;
                text.y += offsetY;
            }
        }
    };

    clear() {
        while (this.#nodes.length > 0) {
            this.#nodes[0].kill();
        }

        while (this.#texts.length > 0) {
            this.#texts[0].kill();
        }
    };

    deserialize(animationConfiguration, data) {
        this.clear();

        var data = JSON.parse(data);

        var nodes = data[0];
        var edges = data[1];
        var texts = data[2];

        // nodes
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            this.addNode(animationConfiguration, {
                id: node[0],
                x: node[1],
                y: node[2],
                initialValue: node[3],
                label: decodeURIComponent(node[4]),
                hue: node[5]
            });
        }

        // edges
        for (var i = 0; i < edges.length; i++) {
            var edge = edges[i];
            this.addEdge(animationConfiguration, {
                source: Node.getNode(edge[0]),
                target: Node.getNode(edge[1]),
                arc: edge[2],
                strength: edge[3],
                rotation: edge[4]
            });
        }

        // texts
        for (var i = 0; i < texts.length; i++) {
            var text = texts[i];
            this.addText(animationConfiguration, {
                x: text[0],
                y: text[1],
                value: decodeURIComponent(text[2])
            });
        }

        this.dirty = false;
    };

    draw(configuration) {
        if (this.#mouse.pressed && this.#stroke.length > 0) { // stroke
            var lastPoint = this.#stroke[this.#stroke.length - 1];

            // style
            this.#context.strokeStyle = "#ccc";
            this.#context.lineWidth = 5;
            this.#context.lineCap = "round";

            // draw line from last to current
            this.#context.beginPath();
            this.#context.moveTo(lastPoint[0] * 2, lastPoint[1] * 2);
            this.#context.lineTo(this.#mouse.x * 2, this.#mouse.y * 2);
            this.#context.stroke();

            // update last point
            this.#stroke.push([this.#mouse.x, this.#mouse.y]);

            return;
        }

        // draw model only if arrow-signals are moving
        for (var i = 0; i < this.#edges.length; i++) {
            if (this.#edges[i].signals.length > 0) {
                this.#drawCountdown = this.#drawCountdownFull;
                break;
            }
        }

        this.#drawCountdown--;
        if (this.#drawCountdown <= 0) return;

        // also only draw if updated
        if (!this.#updated) return;
        this.#updated = false;

        // clear & save
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#context.save();

        // translate to center, (translate, scale, translate) to expand to size
        var CW = this.#dom.clientWidth - (2 * this.#padding.all);
        var CH = this.#dom.clientHeight - this.#padding.bottom - this.#padding.all;
        var tx = this.#offset.x * 2;
        var ty = this.#offset.y * 2;
        var s = this.#offset.scale

        tx -= CW + this.#padding.all;
        ty -= CH + this.#padding.all;
        tx = s * tx;
        ty = s * ty;
        tx += CW + this.#padding.all;
        ty += CH + this.#padding.all;

        if (this.#embedded) { // dunno why but this is needed
            tx += this.#padding.all;
            ty += this.#padding.all;
        }

        this.#context.setTransform(s, 0, 0, s, tx, ty);

        // draw all
        for (var i = 0; i < this.#texts.length; i++) this.#texts[i].draw(this.#context, configuration);
        for (var i = 0; i < this.#edges.length; i++) this.#edges[i].draw(this.#context, configuration);
        for (var i = 0; i < this.#nodes.length; i++) this.#nodes[i].draw(this.#context, configuration);

        // restore
        this.#context.restore();
    };

    getBounds() {
        if (this.#nodes.length == 0 && this.#texts.length == 0) return;

        // get bounds of all objects
        var left = Infinity;
        var top = Infinity;
        var right = -Infinity;
        var bottom = -Infinity;

        var processItems = function (items) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var bounds = item.getBoundingBox(this.#context);
                if (left > bounds.left) left = bounds.left;
                if (top > bounds.top) top = bounds.top;
                if (right < bounds.right) right = bounds.right;
                if (bottom < bounds.bottom) bottom = bounds.bottom;
            }
        }.bind(this);

        processItems(this.#nodes);
        processItems(this.#edges);
        processItems(this.#texts);

        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom
        };

    };

    isComposing() {
        return this.#mode == Model.MODE_COMPOSE;
    }

    isPlaying() {
        return this.#mode == Model.MODE_PLAY;
    }

    serialize() {
        var data = []; // 0: nodes, 1: edges, 2: labels, 3: UID

        // nodes
        var nodes = [];
        for (var i = 0; i < this.#nodes.length; i++) {
            var node = this.#nodes[i];

            // 0: id, 1: x, 2: y, 3: initialValue, 4: label, 5: hue
            nodes.push([
                node.id,
                Math.round(node.x),
                Math.round(node.y),
                node.initialValue,
                encodeURIComponent(encodeURIComponent(node.label)),
                node.hue
            ]);
        }

        // edges
        var edges = [];
        for (var i = 0; i < this.#edges.length; i++) {
            var edge = this.#edges[i];

            // 0: from, 1: to, 2: arc, 3: stregth, 4: rotation
            edges.push([
                edge.source.id,
                edge.target.id,
                Math.round(edge.arc),
                edge.strength,
                edge.isLoop() ? Math.round(edge.rotation) : null
            ]);
        }

        // Labels
        var texts = [];
        for (var i = 0; i < this.#texts.length; i++) {
            var text = this.#texts[i];

            // 0: x, 1: y, 2: value
            texts.push([
                Math.round(text.x),
                Math.round(text.y),
                encodeURIComponent(encodeURIComponent(text.value))
            ]);
        }

        data.push(nodes);
        data.push(edges);
        data.push(texts);

        // only uri encode quotes, also replace the last character
        var dataString = JSON.stringify(data);
        dataString = dataString.replace(/"/gi, "%22");
        dataString = dataString.substring(0, dataString.length - 1) + "%5D";
        return dataString;
    };

    setMode(mode) {
        this.#mode = mode;
        if (this.isComposing()) {
            publish("model/reset");
            this.#drawCountdown = this.#drawCountdownFull * 2;
        } else {
            this.#drawCountdown = this.#drawCountdownFull;
        }

        publish("model/mode/changed");
    }

    update(configuration) {
        _configureProperties(configuration, configuration, {
            isPlaying: this.isPlaying()
        });

        for (var i = 0; i < this.#texts.length; i++) {
            this.#texts[i].update(this.#mouse, configuration);
        }

        for (var i = 0; i < this.#edges.length; i++) {
            this.#edges[i].update(this.#mouse, configuration);
        }

        for (var i = 0; i < this.#nodes.length; i++) {
            this.#nodes[i].update(this.#mouse, configuration);
        }

        this.#updated = true;
    };
    //**********************************************************************/
    // ITEM METHODS
    /**********************************************************************/
    addEdge(animationConfiguraiton, edgeConfiguration) {
        var edge = new Edge(edgeConfiguration);
        edge.initialize(this, this.#mouse);

        this.#edges.push(edge);

        publish("model/changed");

        return edge;
    };

    addNode(animationConfiguraiton, nodeConfiguration) {
        var node = new Node(nodeConfiguration);
        node.initialize(this, this.#mouse);

        this.#nodes.push(node)
        this.update(animationConfiguraiton);

        publish("model/changed");

        return node;
    }

    addStroke(stroke) {
        this.#stroke.push(stroke)

        publish("model/changed");
    }

    addText(animationConfiguraiton, textConfiguration) {
        var text = new Text(textConfiguration);
        text.initialize(this, this.#mouse);

        this.#texts.push(text)
        this.update(animationConfiguraiton);

        publish("model/changed");

        return text;
    };

    getStroke() {
        return this.#stroke;
    };

    getEdgeByCoordinates(x, y, buffer) {
        for (var i = this.#edges.length - 1; i >= 0; i--) { // top-down
            var edge = this.#edges[i];
            if (edge.isPointOnLabel(x, y, buffer)) return edge;
        }
        return null;
    };

    getEdgesByStartNode(startNode) {
        return this.#edges.filter(function (edge) {
            return (edge.from === startNode);
        });
    };

    getNodeByCoordinates(x, y, buffer) {
        for (var i = this.#nodes.length - 1; i >= 0; i--) { // top-down
            var node = this.#nodes[i];
            if (node.isPointInNode(this.#context, x, y, buffer)) return node;
        }
        return null;
    };

    getTextByCoordinates(x, y, buffer) {
        for (var i = this.#texts.length - 1; i >= 0; i--) { // top-down
            var text = this.#texts[i];
            if (text.isPointInText(this.#context, x, y)) return text;
        }
        return null;
    };

    removeEdge(edge) {
        this.#edges.splice(this.#edges.indexOf(edge), 1);

        publish("model/changed");
    };

    removeNode(node) {
        this.#nodes.splice(this.#nodes.indexOf(node), 1);

        // Remove all associated TO and FROM edges
        for (var i = 0; i < this.#edges.length; i++) {
            var edge = this.#edges[i];
            if (edge.isAssociated(node)) {
                edge.kill();
                i--; // move index back, because it's been killed
            }
        }
        publish("model/changed");
    };

    removeStroke() {
        this.#stroke = [];

        publish("model/changed", [true]);
    }

    removeText(text) {
        this.#texts.splice(this.#texts.indexOf(text), 1);

        publish("model/changed");
    };

    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #removeItem(item) {
        if (item.type == Item.TEXT) {
            this.removeText(item);
        } else if (item.type == Item.NODE) {
            this.removeNode(item);
        } else if (item.type == Item.EDGE) {
            this.removeEdge(item);
        }
    }
}