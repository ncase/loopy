window.Mouse = {};
Mouse.init = function(target){

	// Events!
	const _onmousedown = function(){
		Mouse.moved = false;
		Mouse.pressed = true;
		Mouse.startedOnTarget = true;
		publish("mousedown");
	};
	const _onmousewheel = function(event){
		publish("mousewheel",[event]);
	};
	const _onmousemove = function(event){

		const m = mouseToMouse(event.x,event.y,loopy.offsetScale,loopy.offsetX,loopy.offsetY);
		// Mouse!
		Mouse.x = m.x;
		Mouse.y = m.y;

		Mouse.moved = true;
		publish("mousemove");

	};
	const _onmouseup = function(){
		Mouse.pressed = false;
		if(Mouse.startedOnTarget){
			publish("mouseup");
			if(!Mouse.moved) publish("mouseclick");
		}
		Mouse.moved = false;
		Mouse.startedOnTarget = false;
	};

	// Add mouse & touch events!
	_addMouseEvents(target, _onmousedown, _onmousemove, _onmouseup,_onmousewheel);

	// Cursor & Update
	Mouse.target = target;
	Mouse.showCursor = function(cursor){
		Mouse.target.style.cursor = cursor;
	};
	Mouse.update = function(){
		Mouse.showCursor("");
	};

};
function mouseToMouse(mx,my,scale,offsetX,offsetY){
	// DO THE INVERSE
	const canvasses = document.getElementById("canvasses");
	let tx = 0;
	let ty = 0;
	const s = 1/scale;
	const CW = canvasses.clientWidth - _PADDING - _PADDING;
	const CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;

	if(loopy.embedded){
		tx -= _PADDING/2; // dunno why but this is needed
		ty -= _PADDING/2; // dunno why but this is needed
	}

	tx -= (CW+_PADDING)/2;
	ty -= (CH+_PADDING)/2;

	tx = s*tx;
	ty = s*ty;

	tx += (CW+_PADDING)/2;
	ty += (CH+_PADDING)/2;

	tx -= offsetX;
	ty -= offsetY;

	// Mutliply by Mouse vector
	const x = mx*s + tx;
	const y = my*s + ty;
	return {x,y};
}