window.Mouse = {};
Mouse.init = function(target){

	// Events!
	var _onmousedown = function(event){
		Mouse.moved = false;
		Mouse.pressed = true;
		Mouse.startedOnTarget = true;
		publish("mousedown");
	};
	var _onmousemove = function(event){
		Mouse.x = event.x;
		Mouse.y = event.y;
		Mouse.moved = true;
		publish("mousemove");
	};
	var _onmouseup = function(){
		Mouse.pressed = false;
		if(Mouse.startedOnTarget){
			publish("mouseup");
			if(!Mouse.moved) publish("mouseclick");
		}
		Mouse.moved = false;
		Mouse.startedOnTarget = false;
	};

	// Add mouse & touch events!
	_addMouseEvents(target, _onmousedown, _onmousemove, _onmouseup);

	// Cursor & Update
	Mouse.target = target;
	Mouse.showCursor = function(cursor){
		Mouse.target.style.cursor = cursor;
	};
	Mouse.update = function(){
		Mouse.showCursor("");
	};

};