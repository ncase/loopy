(function(exports){

	// Singleton
	var Key = {};
	exports.Key = Key;

	// Keycodes to words mapping
	var KEY_CODES = {
		
		17: "control",
		91: "control", // macs

		// TODO: Standardize the NAMING across files?!?!
		68: "ink", // (D)raw
		77: "drag", // (M)ove
		69: "erase" // (E)rase

	};

	// Keyboard Combos
	// TODO: Keyboard c-c-c-combos
	var KEY_COMBOS = [
		//{combo:[], publish:""}
	];

	// Event Handling
	// TODO: cursors stay when click button? orrrrr switch over to fake-cursor.
	Key.onKeyDown = function(event){
		var code = KEY_CODES[event.keyCode];
	    Key[code] = true;
	    publish("key/"+code);
	    event.stopPropagation();
	    event.preventDefault();
	}
	Key.onKeyUp = function(event){
		var code = KEY_CODES[event.keyCode];
	    Key[code] = false;
	    event.stopPropagation();
	    event.preventDefault();
	}
	window.addEventListener("keydown",Key.onKeyDown,false);
	window.addEventListener("keyup",Key.onKeyUp,false);

})(window);