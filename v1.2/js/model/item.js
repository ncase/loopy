class Item {
    static get TEXT() { return "TEXT"; };
    static get NODE() { return "NODE"; };
    static get EDGE() { return "EDGE"; };

    #type
    #selected

    get type() { return this.#type; }
    get selected() { return this.#selected; }

    set selected(selected) { this.#selected = selected; }

    constructor(type, configuration) {
        _validateAssigned(type, "Type must be provided.");
        _validateAssigned(configuration, "Configuration object must be provided.");

        this.#type = type;
        this.#selected = false;
    }

    initialize(model, mouse) { _throwErrorMessage("Not implemented yet!") }
    draw(context, wobbleControls) { _throwErrorMessage("Not implemented yet!") }
    move(x, y) { _throwErrorMessage("Not implemented yet!") };
    kill() { _throwErrorMessage("Not implemented yet!") };
    update(mouse, configuration) { _throwErrorMessage("Not implemented yet!") }
}