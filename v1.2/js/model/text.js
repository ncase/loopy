class Text extends Item {
    static get FONT_SIZE() { return "40"; };

    #x;
    #y;
    #value;

    get x() { return this.#x; }
    get y() { return this.#y; }
    get value() { return this.#value; }

    set x(x) { this.#x = x; }
    set y(y) { this.#y = y; }
    set value(value) { this.#value = value; }

    constructor(configuration) {
        super(Item.TEXT, configuration);

        _validateTrue(configuration.x && configuration.x >= 0, "X axis coordinate 'x' must be provided in configuration as a non-negative number.");
        _validateTrue(configuration.y && configuration.y >= 0, "Y axis coordinate 'y' must be provided in configuration as a non-negative number.");
        _validateAssigned(configuration.value, "Initial text value must be present in the configuration.");

        this.#x = configuration.x;
        this.#y = configuration.y;
        this.#value = configuration.value;
    }

    getBoundingBox(context) {
        var bounds = this.#getBounds(context);
        return {
            left: bounds.x,
            top: bounds.y,
            right: bounds.x + bounds.width,
            bottom: bounds.y + bounds.height
        };
    };

    draw(context, configuration) {
        // retina
        var x = this.x * 2;
        var y = this.y * 2;

        // highlight selected
        if (this.selected) {
            var bounds = this.#getBounds(context);
            context.save();
            context.scale(2, 2); // retina
            context.beginPath();
            context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.fillStyle = HIGHLIGHT_COLOR;
            context.fill();
            context.restore();
        }

        context.save();
        context.translate(x, y);

        context.font = "100 " + Text.FONT_SIZE + "px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#000000";

        var lines = this.#breakText();
        context.translate(0, -(Text.FONT_SIZE * lines.length) / 2);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            context.fillText(line, 0, 0);
            context.translate(0, Text.FONT_SIZE);
        }

        context.restore();
    }

    initialize(model, mouse) { }

    isPointInText(context, x, y) {
        return _isPointInBox(x, y, this.#getBounds(context));
    };

    kill() {
        publish("kill", [this]);
    };

    move(x, y) {
        this.x = x;
        this.y = y;
    }

    update(mouse, configuration) { }
    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #breakText() {
        return this.value.split(/\n/);
    };

    #getBounds(context) {
        var lines = this.#breakText();

        var maxWidth = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var w = (context.measureText(line).width + 10) * 2;
            if (maxWidth < w) maxWidth = w;
        }

        var w = maxWidth;
        var h = (Text.FONT_SIZE * lines.length) / 2;

        return {
            x: this.x - w / 2,
            y: this.y - h / 2 - Text.FONT_SIZE / 2,
            width: w,
            height: h + Text.FONT_SIZE / 2
        };
    };
}

