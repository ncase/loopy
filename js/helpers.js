/*****************************

A miscellaneous collection of reuseable helper methods
that I couldn't be arsed to put into separate classes

*****************************/

Math.TAU = Math.PI*2;

window.HIGHLIGHT_COLOR = "rgba(193, 220, 255, 0.6)";

var isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)?true:false;

window.onresize = function(){
	publish("resize");
};

function _createCanvas(){

	var canvasses = document.getElementById("canvasses");
	var canvas = document.createElement("canvas");

	// Dimensions
	var _onResize = function(){
		var width = canvasses.clientWidth;
		var height = canvasses.clientHeight;
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
	var label = document.createElement("div");
	label.innerHTML = message;
	label.setAttribute("class","component_label");
	return label;
}

function _createButton(label, onclick){
	var button = document.createElement("div");
	button.innerHTML = label;
	button.onclick = onclick;
	button.setAttribute("class","component_button");
	return button;
}

function _createInput(className, textarea){
	var input = textarea ? document.createElement("textarea") : document.createElement("input");
	input.setAttribute("class",className);
	input.addEventListener("keydown",function(event){
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
	},false); // STOP IT FROM TRIGGERING KEY.js
	return input;
}

function _blank(){
	// just a blank function to toss in.
}

function _getTotalOffset(target){
	var bounds = target.getBoundingClientRect();
	return {
		left: bounds.left,
		top: bounds.top
	};
}

function _addMouseEvents(target, onmousedown, onmousemove, onmouseup){

	// WRAP THEM CALLBACKS
	var _onmousedown = function(event){
		var _fakeEvent = _onmousemove(event);
		onmousedown(_fakeEvent);
	};
	var _onmousemove = function(event){
		
		// Mouse position
		var _fakeEvent = {};
		if(event.changedTouches){
			// Touch
			var offset = _getTotalOffset(target);
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
	var _onmouseup = function(event){
		var _fakeEvent = {};
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
	var left=Infinity, top=Infinity, right=-Infinity, bottom=-Infinity;
	for(var i=0;i<points.length;i++){
		var point = points[i];
		if(point[0]<left) left=point[0];
		if(right<point[0]) right=point[0];
		if(point[1]<top) top=point[1];
		if(bottom<point[1]) bottom=point[1];
	}

	// Dimensions
	var width = (right-left);
	var height = (bottom-top);

	// Gimme
	return {
		left:left, right:right, top:top, bottom:bottom,
		width:width, height:height
	};
	
}

function _translatePoints(points, dx, dy){
	points = JSON.parse(JSON.stringify(points));
	for(var i=0;i<points.length;i++){
		var p = points[i];
		p[0] += dx;
		p[1] += dy;
	}
	return points;
}

function _rotatePoints(points, angle){
	points = JSON.parse(JSON.stringify(points));
	for(var i=0;i<points.length;i++){
		var p = points[i];
		var x = p[0];
		var y = p[1];
		p[0] = x*Math.cos(angle) - y*Math.sin(angle);
		p[1] = y*Math.cos(angle) + x*Math.sin(angle);
	}
	return points;
}

function _configureProperties(self, config, properties){

	for(var propName in properties){

		// Default values!
		if(config[propName]===undefined){
			var value = properties[propName];
			if(typeof value=="function") value=value();
			config[propName] = value;
		}

		// Transfer to "self".
		self[propName] = config[propName];

	}

}

function _isPointInCircle(x, y, cx, cy, radius){
	
	// Point distance
	var dx = cx-x;
	var dy = cy-y;
	var dist2 = dx*dx + dy*dy;

	// My radius
	var r2 = radius*radius;

	// Inside?
	return dist2<=r2;

}

function _isPointInBox(x, y, box){

	if(x<box.x) return false;
	if(x>box.x+box.width) return false;
	if(y<box.y) return false;
	if(y>box.y+box.height) return false;

	return true;

}

// TODO: Make more use of this???
function _makeErrorFunc(msg){
	return function(){
		throw Error(msg);
	};
}

function _getParameterByName(name, url){
	var url = window.top.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
};


function _blendColors(hex1, hex2, blend){
	
	var color = "#";
	for(var i=0; i<3; i++) {
		
		// Into numbers...
		var sub1 = hex1.substring(1+2*i, 3+2*i);
		var sub2 = hex2.substring(1+2*i, 3+2*i);
		var num1 = parseInt(sub1, 16);
		var num2 = parseInt(sub2, 16);

		// Blended number & sub
		var num = Math.floor( num1*(1-blend) + num2*blend );
		var sub = num.toString(16).toUpperCase();
		var paddedSub = ('0'+sub).slice(-2); // in case it's only one digit long

		// Add that babe
		color += paddedSub;

	}

	return color;

}

function _shuffle(array){
	array = array.slice(0,array.length); // copy.
	var currentIndex = array.length, temporaryValue, randomIndex;
	// While there remain elements to shuffle...
	while(0 !== currentIndex){
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}


