(function (exports) {
    // Keycodes to words mapping
    var KEY_CODES = {
        17: "control",
        91: "control", // macos command
        13: "enter", // enter

        77: "move", // (M)OVE
        80: "pen", // (P)EN
        69: "erase", // (E)RASE
        84: "text", // (T)EXT
        
        49: "link", // (1) Save as link
        50: "embed", // (2) Embed
        51: "import", // (3) import file
        52: "export", // (4) export file
    };

    // singleton
    var Key = {};
    exports.Key = Key;

    Key.onKeyDown = function (event) {
        if (window.loopy && window.loopy.modal && window.loopy.modal.open) return;
        var code = KEY_CODES[event.keyCode];

        if (code) {
            Key[code] = true;
            publish("key/" + code);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    Key.onKeyUp = function (event) {
        if (window.loopy && window.loopy.modal && window.loopy.modal.open) return;

        var code = KEY_CODES[event.keyCode];
        if (code) {
            Key[code] = false;
        }

        event.stopPropagation();
        event.preventDefault();
    }

    exports.addEventListener("keydown", Key.onKeyDown, false);
    exports.addEventListener("keyup", Key.onKeyUp, false);
})(window);