(function(exports){

	// Singleton
	var Key = {};
	exports.Key = Key;

	// Keycodes to words mapping
	var KEY_CODES = {
		
		17: "control",
		91: "control", // macs
		13: "enter", // enter

		// TODO: Standardize the NAMING across files?!?!
		78: "ink", // Pe(n)cil
		86: "drag", // Mo(v)e
		69: "erase", // (E)rase
		84: "label" // (T)ext

	};

	// Event Handling
	// TODO: cursors stay when click button? orrrrr switch over to fake-cursor.
	Key.onKeyDown = function(event){
		if(loopy.model.isShowing) return;
		var code = KEY_CODES[event.keyCode];
	    Key[code] = true;
	    publish("key/"+code);
	    event.stopPropagation();
	    event.preventDefault();
	}
	Key.onKeyUp = function(event){
		if(loopy.model.isShowing) return;
		var code = KEY_CODES[event.keyCode];
	    Key[code] = false;
	    event.stopPropagation();
	    event.preventDefault();
	}
	window.addEventListener("keydown",Key.onKeyDown,false);
	window.addEventListener("keyup",Key.onKeyUp,false);

})(window);