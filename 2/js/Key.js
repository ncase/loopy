(function(exports){

	// Singleton
	const Key = {};
	exports.Key = Key;

	// Keycodes to words mapping
	const KEY_CODES = {
		
		17: "control",
		91: "control", // macs
		13: "enter", // enter
		46: "delete",

		// TODO: Standardize the NAMING across files?!?!
		78: "ink", // Pe(n)cil
		86: "drag", // Mo(v)e
		69: "erase", // (E)rase
		84: "label", // (T)ext
		83: "save", // (S)ave

	};

	// Event Handling
	// TODO: cursors stay when click button? orrrrr switch over to fake-cursor.
	Key.onKeyDown = function(event){
		if(window.loopy && loopy.modal && loopy.modal.isShowing) return;
		// noinspection JSDeprecatedSymbols
		const code = KEY_CODES[event.keyCode];
		//console.log(event.keyCode, event.code, event.key,event.charCode);
		if(!code) return;
	    Key[code] = true;
	    publish("key/"+code);
	    event.stopPropagation();
	    event.preventDefault();
	};
	Key.onKeyUp = function(event){
		if(window.loopy && loopy.modal && loopy.modal.isShowing) return;
		// noinspection JSDeprecatedSymbols
		const code = KEY_CODES[event.keyCode];
		if(!code) return;
	    Key[code] = false;
	    event.stopPropagation();
	    event.preventDefault();
	};
	window.addEventListener("keydown",Key.onKeyDown,false);
	window.addEventListener("keyup",Key.onKeyUp,false);

})(window);