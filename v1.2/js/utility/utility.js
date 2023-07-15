/**************************************************************************/
/**************************************************************************/
function _addMouseEvents(target, eventSource) {
	var _onmousedown = function (event) {
		var _fakeEvent = _onmousemove(event);
		eventSource.onMouseDown(_fakeEvent);
	};

	var _onmousemove = function (event) {
		var _fakeEvent = {};
		if (event.changedTouches) { // touch
			var offset = _getTotalOffset(target);
			_fakeEvent.x = event.changedTouches[0].clientX - offset.left;
			_fakeEvent.y = event.changedTouches[0].clientY - offset.top;
			event.preventDefault();
		} else { // not touch

			_fakeEvent.x = event.offsetX;
			_fakeEvent.y = event.offsetY;
		}
		eventSource.onMouseMove(_fakeEvent);
		return _fakeEvent;
	};
	var _onmouseup = function (event) {
		var _fakeEvent = {};
		eventSource.onMouseUp(_fakeEvent);
	};

	// add events
	target.addEventListener("mousedown", _onmousedown);
	target.addEventListener("mousemove", _onmousemove);
	document.body.addEventListener("mouseup", _onmouseup);

	// touch
	target.addEventListener("touchstart", _onmousedown, false);
	target.addEventListener("touchmove", _onmousemove, false);
	document.body.addEventListener("touchend", _onmouseup, false);
}
/**************************************************************************/
/**************************************************************************/
function _blendColors(color1, color2, blend) {
	var color = "#";
	for (var i = 0; i < 3; i++) {
		var sub1 = color1.substring(1 + 2 * i, 3 + 2 * i);
		var sub2 = color2.substring(1 + 2 * i, 3 + 2 * i);
		var num1 = parseInt(sub1, 16);
		var num2 = parseInt(sub2, 16);

		// blended number & sub
		var num = Math.floor(num1 * (1 - blend) + num2 * blend);
		var sub = num.toString(16).toUpperCase();
		var paddedSub = ('0' + sub).slice(-2); // in case it's only one digit long

		color += paddedSub;
	}
	return color;
}
/**************************************************************************/
/**************************************************************************/
function _createCanvas(dom) {
	var canvas = document.createElement("canvas");

	// dimensions
	var __onResize = function () {
		var width = dom.clientWidth;
		var height = dom.clientHeight;

		canvas.width = width * 2; // retina
		canvas.style.width = width + "px";

		canvas.height = height * 2; // retina
		canvas.style.height = height + "px";
	};
	__onResize();

	dom.appendChild(canvas);

	subscribe("resize", function () {
		__onResize();
	});
	return canvas;
}
/**************************************************************************/
/**************************************************************************/
function _configureProperties(object, configuration, properties) {
	for (var propertyName in properties) {
		// default values
		if (configuration[propertyName] === undefined) {
			var value = properties[propertyName];
			if (typeof value == "function") value = value();
			configuration[propertyName] = value;
		}
		// transfer to "object"
		object[propertyName] = configuration[propertyName];
	}
}
/**************************************************************************/
/**************************************************************************/
function _createButton(label, onclick) {
	var button = document.createElement("div");

	button.innerHTML = label;
	button.onclick = onclick;
	button.setAttribute("class", "component-button");

	return button;
}
/**************************************************************************/
/**************************************************************************/
function _createTextInput(className, textarea, oninput) {
	var input = textarea ? document.createElement("textarea") : document.createElement("input");

	input.oninput = oninput;
	input.setAttribute("class", className);
	input.addEventListener("keydown", function (event) {
		event.stopPropagation(); // stop it from triggering key.js
	}, false);

	return input;
}
/**************************************************************************/
/**************************************************************************/
function _createLabel(message) {
	var label = document.createElement("div");

	label.innerHTML = message;
	label.setAttribute("class", "component-label");

	return label;
}
/**************************************************************************/
/**************************************************************************/
function _createNumberInput(onUpdate) {
	var self = {};

	self.dom = document.createElement("input");
	self.dom.style.border = "none";
	self.dom.style.width = "40px";
	self.dom.style.padding = "5px";

	self.dom.addEventListener("keydown", function (event) {
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
	},
		false); // STOP IT FROM TRIGGERING KEY.js

	// on update
	self.dom.onchange = function () {
		var value = parseInt(self.getValue());
		if (isNaN(value)) value = 0;
		self.setValue(value);
		onUpdate(value);
	};

	// select on click, yo
	self.dom.onclick = function () {
		self.dom.select();
	};

	// set & get value
	self.getValue = function () {
		return self.dom.value;
	};

	self.setValue = function (number) {
		self.dom.value = number;
	};

	// return an OBJECT.
	return self;
}
/**************************************************************************/
/**************************************************************************/
function _format(template) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    return template.replace(/%s/g, () => args[i++]);
}
/**************************************************************************/
/**************************************************************************/
function _getBounds(points) {
	// Bounds
	var left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
	for (var i = 0; i < points.length; i++) {
		var point = points[i];
		if (point[0] < left) left = point[0];
		if (right < point[0]) right = point[0];
		if (point[1] < top) top = point[1];
		if (bottom < point[1]) bottom = point[1];
	}

	// Dimensions
	var width = (right - left);
	var height = (bottom - top);

	return { left: left, right: right, top: top, bottom: bottom, width: width, height: height };
}
/**************************************************************************/
/**************************************************************************/
function _getParameterByName(name) {
	var url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
};
/**************************************************************************/
/**************************************************************************/
function _isPointInBox(x, y, box) {
	if (x < box.x) return false;
	if (x > box.x + box.width) return false;
	if (y < box.y) return false;
	if (y > box.y + box.height) return false;
	return true;
}
/**************************************************************************/
/**************************************************************************/
function _isPointInCircle(x, y, cx, cy, radius) {
	// point distance
	var dx = cx - x;
	var dy = cy - y;
	var distanceSquared = dx * dx + dy * dy;

	// radius
	var radiusSquared = radius * radius;

	return distanceSquared <= radiusSquared;
}
/**************************************************************************/
/**************************************************************************/
function _rotatePoints(points, angle) {
	points = JSON.parse(JSON.stringify(points));
	for (var i = 0; i < points.length; i++) {
		var p = points[i];
		var x = p[0];
		var y = p[1];
		p[0] = x * Math.cos(angle) - y * Math.sin(angle);
		p[1] = y * Math.cos(angle) + x * Math.sin(angle);
	}
	return points;
}
/**************************************************************************/
/**************************************************************************/
function _translatePoints(points, dx, dy) {
	points = JSON.parse(JSON.stringify(points));
	for (var i = 0; i < points.length; i++) {
		var p = points[i];
		p[0] += dx;
		p[1] += dy;
	}
	return points;
}
/**************************************************************************/
/**************************************************************************/
function _throwErrorMessage(message) {
	throw Error(message);
};
/**************************************************************************/
/**************************************************************************/
function _validateAssigned(object, message) {
	_validateTrue(!!object, message);
};
/**************************************************************************/
/**************************************************************************/
function _validateTrue(object, message) {
	if (object !== true) {
		_throwErrorMessage(message);
	}
};
/**************************************************************************/
/**************************************************************************/