
class Mouse {
    #configuration;
    #x; #y; #moved; #pressed;
    #target; #startedOnTarget;

    get x() { return this.#x; }
    get y() { return this.#y; }
    get moved() { return this.#moved; }    
    get pressed() { return this.#pressed; }    

    constructor(target, configuration) {
        _validateAssigned(target, "Target must be provided.");
        _validateAssigned(configuration, "Configuration object must be provided.");
        _validateAssigned(configuration.offset, "Offset information must be present in the configuration.");
        _validateAssigned(configuration.padding, "Padding information must be present in the configuration.");
        _validateTrue(configuration.embedded !== undefined, "Embedded mode information must be present in the configuration.");

        this.#target = target;
        this.#configuration = configuration;

        this.#x = 0;
        this.#y = 0;
        this.#moved = true;
        this.#pressed = false;
        this.#startedOnTarget = false;

        _addMouseEvents(this.#target, this);
    }

    onMouseDown(event) {
        this.#moved = false;
        this.#pressed = true;
        this.#startedOnTarget = true;

        publish("mousedown");
    };

    onMouseMove(event) {
        var tx = 0;
        var ty = 0;
        var s = 1 / this.#configuration.offset.scale;
        var CW = this.#target.clientWidth - (this.#configuration.padding.all)
        var CH = this.#target.clientHeight - this.#configuration.padding.bottom - this.#configuration.padding.all;

        if (this.#configuration.embedded) { // dunno why but this is needed
            tx -= this.#configuration.padding.all / 2;
            ty -= this.#configuration.padding.all / 2;
        }

        tx -= (CW + this.#configuration.padding.all) / 2;
        ty -= (CH + this.#configuration.padding.all) / 2;

        tx = s * tx;
        ty = s * ty;

        tx += (CW + this.#configuration.padding.all) / 2;
        ty += (CH + this.#configuration.padding.all) / 2;

        tx -= this.#configuration.offset.x;
        ty -= this.#configuration.offset.y;

        // Mutliply by Mouse vector
        var mx = event.x * s + tx;
        var my = event.y * s + ty;

        this.#x = mx;
        this.#y = my;
        this.#moved = true;

        publish("mousemove");
    };

    onMouseUp() {
        this.#pressed = false;
        if (this.#startedOnTarget) {
            publish("mouseup");
            if (!this.moved) {
                publish("mouseclick");
            }
        }
        this.#moved = false;
        this.#startedOnTarget = false;
    };

    showCursor(cursorStyle) {
        this.#target.style.cursor = cursorStyle;
    };

    update() {
        this.showCursor("");
    };
}