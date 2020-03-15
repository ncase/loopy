/*****************************

A miscellaneous collection of reuseable helper methods
that I couldn't be arsed to put into separate classes

*****************************/

Math.TAU = Math.PI*2;

window.HIGHLIGHT_COLOR = "rgba(193, 220, 255, 0.6)";

const isMacLike = !!navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i);

const _PADDING = 25;
let _PADDING_BOTTOM = 110;

window.onresize = function(){
	publish("resize");
};

window.onbeforeunload = function(e) {
	if(loopy.dirty){
		const dialogText = "Are you sure you want to leave without saving your changes?";
		e.returnValue = dialogText;
		return dialogText;
	}
};

function _createCanvas(){

	const canvasses = document.getElementById("canvasses");
	const canvas = document.createElement("canvas");

	// Dimensions
	const _onResize = function(){
		const width = canvasses.clientWidth;
		const height = canvasses.clientHeight;
		canvas.width = width*2; // retina
		canvas.style.width = width+"px";
		canvas.height = height*2; // retina
		canvas.style.height = height+"px";
	};
	_onResize();

	// Add to body!
	canvasses.appendChild(canvas);

	// subscribe to RESIZE
	subscribe("resize",function(){
		_onResize();
	});

	// Gimme
	return canvas;

}

function _createLabel(message){
	const label = document.createElement("div");
	label.innerHTML = message;
	label.setAttribute("class","component_label");
	return label;
}

function _createButton(label, onclick){
	const button = document.createElement("div");
	button.innerHTML = label;
	button.onclick = onclick;
	button.setAttribute("class","component_button");
	return button;
}

function _createInput(className, textarea){
	const input = textarea ? document.createElement("textarea") : document.createElement("input");
	input.setAttribute("class",className);
	input.addEventListener("keydown",function(event){
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
	},false); // STOP IT FROM TRIGGERING KEY.js
	return input;
}

function _createNumberInput(onUpdate){

	const self = {};

	// dom!
	self.dom = document.createElement("input");
	self.dom.style.border = "none";
	self.dom.style.width = "40px";
	self.dom.style.padding = "5px";

	self.dom.addEventListener("keydown",function(event){
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
	},false); // STOP IT FROM TRIGGERING KEY.js

	// on update
	self.dom.onchange = function(){
		let value = parseInt(self.getValue());
		if(isNaN(value)) value=0;
		self.setValue(value);
		onUpdate(value);
	};

	// select on click, yo
	self.dom.onclick = function(){
		self.dom.select();
	};

	// set & get value
	self.getValue = function(){
		return self.dom.value;
	};
	self.setValue = function(num){
		self.dom.value = num;
	};

	// return an OBJECT.
	return self;

}

function _blank(){
	// just a blank function to toss in.
}

function _getTotalOffset(target){
	const bounds = target.getBoundingClientRect();
	return {
		left: bounds.left,
		top: bounds.top
	};
}

function _addMouseEvents(target, onmousedown, onmousemove, onmouseup){

	// WRAP THEM CALLBACKS
	const _onmousedown = function(event){
		const _fakeEvent = _onmousemove(event);
		onmousedown(_fakeEvent);
	};
	const _onmousemove = function(event){
		
		// Mouse position
		const _fakeEvent = {};
		if(event.changedTouches){
			// Touch
			const offset = _getTotalOffset(target);
			_fakeEvent.x = event.changedTouches[0].clientX - offset.left;
			_fakeEvent.y = event.changedTouches[0].clientY - offset.top;
			event.preventDefault();
		}else{
			// Not Touch
			_fakeEvent.x = event.offsetX;
			_fakeEvent.y = event.offsetY;
		}

		// Mousemove callback
		onmousemove(_fakeEvent);
		return _fakeEvent;

	};
	const _onmouseup = function(){
		const _fakeEvent = {};
		onmouseup(_fakeEvent);
	};

	// Add events!
	target.addEventListener("mousedown", _onmousedown);
	target.addEventListener("mousemove", _onmousemove);
	document.body.addEventListener("mouseup", _onmouseup);

	// TOUCH.
	target.addEventListener("touchstart",_onmousedown,false);
	target.addEventListener("touchmove",_onmousemove,false);
	document.body.addEventListener("touchend",_onmouseup,false);

}

function _getBounds(points){

	// Bounds
	let left=Infinity, top=Infinity, right=-Infinity, bottom=-Infinity;
	for(let i=0;i<points.length;i++){
		const point = points[i];
		if(point[0]<left) left=point[0];
		if(right<point[0]) right=point[0];
		if(point[1]<top) top=point[1];
		if(bottom<point[1]) bottom=point[1];
	}

	// Dimensions
	const width = (right-left);
	const height = (bottom-top);

	// Gimme
	return {
		left:left, right:right, top:top, bottom:bottom,
		width:width, height:height
	};
	
}

function _translatePoints(points, dx, dy){
	points = JSON.parse(JSON.stringify(points));
	for(let i=0;i<points.length;i++){
		const p = points[i];
		p[0] += dx;
		p[1] += dy;
	}
	return points;
}

function _rotatePoints(points, angle){
	points = JSON.parse(JSON.stringify(points));
	for(let i=0;i<points.length;i++){
		const p = points[i];
		const x = p[0];
		const y = p[1];
		p[0] = x*Math.cos(angle) - y*Math.sin(angle);
		p[1] = y*Math.cos(angle) + x*Math.sin(angle);
	}
	return points;
}

function _configureProperties(self, config, properties){

	for(let propName in properties) if(properties.hasOwnProperty(propName)){

		// Default values!
		if(config[propName]===undefined){
			let value = properties[propName];
			if(typeof value=="function") value=value();
			config[propName] = value;
		}

		// Transfer to "self".
		self[propName] = config[propName];

	}

}

function _isPointInCircle(x, y, cx, cy, radius){
	
	// Point distance
	const dx = cx-x;
	const dy = cy-y;
	const dist2 = dx*dx + dy*dy;

	// My radius
	const r2 = radius*radius;

	// Inside?
	return dist2<=r2;

}

function _isPointInBox(x, y, box){
	return !(x < box.x
		|| x > box.x + box.width
		|| y < box.y
		|| y > box.y + box.height);
}

// TODO: Make more use of this???
function _makeErrorFunc(msg){
	return function(){
		throw Error(msg);
	};
}

function _getParameterByName(name){
	const url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function _blendColors(hex1, hex2, blend){
	
	let color = "#";
	for(let i=0; i<3; i++) {
		
		// Into numbers...
		const sub1 = hex1.substring(1+2*i, 3+2*i);
		const sub2 = hex2.substring(1+2*i, 3+2*i);
		const num1 = parseInt(sub1, 16);
		const num2 = parseInt(sub2, 16);

		// Blended number & sub
		const num = Math.floor( num1*(1-blend) + num2*blend );
		const sub = num.toString(16).toUpperCase();
		const paddedSub = ('0'+sub).slice(-2); // in case it's only one digit long

		// Add that babe
		color += paddedSub;

	}

	return color;

}

function _shiftArray(array, shiftIndex){
	const moveThisAround = array.splice(-shiftIndex);
	// noinspection UnnecessaryLocalVariableJS
	const shifted = moveThisAround.concat(array);
	return shifted;
}


