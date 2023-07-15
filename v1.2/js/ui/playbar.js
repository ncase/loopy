class Playbar extends UI {
    static get PAGE_ID_COMPOSE() { return "COMPOSE" };
    static get PAEG_ID_PLAY() { return "PLAY" };

    constructor(dom, configuration) {
        super(dom)

        this.addPage(Playbar.PAGE_ID_COMPOSE, this.#initializeComposePage(configuration));
        this.addPage(Playbar.PAEG_ID_PLAY, this.#initializePlayPage(configuration));

        this.showPage(Playbar.PAGE_ID_COMPOSE);

        subscribe("key/enter", function () {
            if (Key.control) {
                if (configuration.isComposing()) {
                    configuration.play();
                } else {
                    configuration.compose();
                }
            }
        }.bind(this));
    }

    #initializeComposePage(configuration) {
        var page = new PlaybarPage();

        // play
        var buttonDOM = page.addComponent(new PlaybarButton({
            icon: "gg-play-button",
            label: "Play",
            tooltip: isMacLike ? "⌘ + Enter" : "Ctrl + Enter",
            big: true,
            onclick: function () {
                configuration.play();
            }
        })).dom;
        buttonDOM.style.fontSize = "28px";
        buttonDOM.style.height = "35px";

        return page;
    }

    #initializePlayPage(configuration) {
        var page = new PlaybarPage();
        if (configuration.embedded) {
            // reset
            var buttonDOM = page.addComponent(new PlaybarButton({
                icon: "gg-undo",
                label: "Reset",
                onclick: function () {
                    publish("model/reset");
                }
            })).dom;
            buttonDOM.style.width = "100px";
            buttonDOM.style.left = "0px";
            buttonDOM.style.top = "0px";
            // remix
            var buttonDOM = page.addComponent(new PlaybarButton({
                icon: "gg-external",
                label: "Remix",
                onclick: function () {
                    window.open(configuration.saveToURL("embed"), '_blank');
                }
            })).dom;
            buttonDOM.style.width = "100px";
            buttonDOM.style.right = "0px";
            buttonDOM.style.top = "0px";
        } else {
            // stop
            var buttonDOM = page.addComponent(new PlaybarButton({
                icon: "gg-play-stop",
                label: "Stop",
                onclick: function () {
                    configuration.compose();
                }.bind(this)
            })).dom;
            buttonDOM.style.width = "100px";
            buttonDOM.style.left = "0px";
            buttonDOM.style.top = "0px";

            // reset
            var buttonDOM = page.addComponent(new PlaybarButton({
                icon: "gg-undo",
                label: "Reset",
                onclick: function () {
                    publish("model/reset");
                }
            })).dom;
            buttonDOM.style.width = "100px";
            buttonDOM.style.right = "0px";
            buttonDOM.style.top = "0px";
        }

        // animation speed
        var speedSlider = page.addComponent(new PlaybarSlider({
            value: configuration.getAnimationSpeed(),
            min: 0, max: 6, step: 0.2,
            oninput: function (value) {
                configuration.setAnimationSpeed(value);
            }
        })).dom;
        speedSlider.style.bottom = "0px";

        return page;
    }

}

class PlaybarPage extends UIPage {
    constructor() {
        super();
    }
}

class PlaybarButton {
    #dom;

    get dom() { return this.#dom; }

    constructor(configuration) {
        var label =
            '<div class="play-button-icon"><div class="' + configuration.icon + '" ></div></div> ' +
            '<div class="play-button-label">' + configuration.label + '</div>';

        this.#dom = _createButton(label, function () {
            configuration.onclick();
        });

        this.#dom.setAttribute("big", configuration.big ? "yes" : "no");

        // tooltip
        if (configuration.tooltip) {
            this.#dom.setAttribute("data-balloon", configuration.tooltip);
            this.#dom.setAttribute("data-balloon-pos", "top");
        }
    }
}

class PlaybarSlider {
    #dom;

    get dom() { return this.#dom; }

    constructor(configuration) {
        this.#dom = document.createElement("div");
        this.#dom.style.bottom = "0px";
        this.#dom.style.position = "absolute";
        this.#dom.style.width = "100%";
        this.#dom.style.height = "20px";

        var decrease = document.createElement("div");
        decrease.setAttribute("class", "play-slider-element gg-remove");
        this.#dom.appendChild(decrease);

        // input
        var input = document.createElement("input");
        input.setAttribute("class", "play-slider");
        input.type = "range";
        input.value = configuration.value;
        input.step = configuration.step;
        input.min = configuration.min;
        input.max = configuration.max;
        input.oninput = function (event) { configuration.oninput(input.value); };

        var inputDiv = document.createElement("div");
        inputDiv.setAttribute("class", "play-slider-element");

        inputDiv.appendChild(input);

        this.#dom.appendChild(inputDiv);



        var increase = document.createElement("div");
        increase.setAttribute("class", "play-slider-element gg-add");
        this.#dom.appendChild(increase);
    }
}