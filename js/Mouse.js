window.Mouse = {};
Mouse.init = function(target){

	// Events!
	// TODO: fire CLICK based on
	var _onmousedown = function(event){
		_onmousemove(event);
		Mouse.moved = false;
		Mouse.pressed = true;
		Mouse.startedOnTarget = true;
		publish("mousedown");
	};
	var _onmousemove = function(event){
		Mouse.moved = true;
		Mouse.x = event.clientX;
		Mouse.y = event.clientY;
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

	// Cursor & Update
	Mouse.target = target;
	Mouse.showCursor = function(cursor){
		Mouse.target.style.cursor = cursor;
	};
	Mouse.update = function(){
		Mouse.showCursor("");
	};

	// Add events!
	target.onmousedown = _onmousedown;
	target.onmousemove = _onmousemove;
	window.onmouseup = _onmouseup;

	// TOUCH.
	// TODO: reuse functions, to also get "startedOnTarget"
	var _onTouchMove;
	target.addEventListener("touchstart",function(event){
		_onTouchMove(event);
	    Mouse.pressed = true;
		publish("mousedown");
	},false);
	target.addEventListener("touchmove", _onTouchMove=function(event){

		Mouse.x = event.changedTouches[0].clientX - target.offsetLeft;
		Mouse.y = event.changedTouches[0].clientY - target.offsetTop;
		if(Mouse.x<0) Mouse.x=0;
		if(Mouse.y<0) Mouse.y=0;
		if(Mouse.x>target.clientWidth) Mouse.x=target.clientWidth;
		if(Mouse.y>target.clientHeight) Mouse.y=target.clientHeight;
		//console.log(target);
		publish("mousemove");
		event.preventDefault();
		
	},false);
	document.body.addEventListener("touchend",function(event){
	    Mouse.pressed = false;
		publish("mouseup");
	},false);

};