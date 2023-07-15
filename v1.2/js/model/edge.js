class Edge extends Item {
    static get #MAX_SIGNALS() { return 100; };
    static get #MAX_SIGNALS_PER_EDGE() { return 10; };

    static DEFAULT_STRENGTH = 1;

    static #allSignals = [];

    #source; #target; #arc = 100; #rotation = 0; #strength = Edge.DEFAULT_STRENGTH;

    #signal = { data: [], speed: 0, size: 40 };
    #listeners = { modelreset: null };

    /** 
     * source coordinates: sx, sy
     * target coordinates: sx, sy
     * target - source different: dx, dy
     * label position: lx, ly
    */
    #parameters = { sx: 0, sy: 0, tx: 0, ty: 0, dx: 0, dy: 0, r: 0, w: 0, a: 0, a2: 0, h: 0, y: 0, y2: 0, begin: 0, end: 0 };
    #label = { text: "", x: 0, y: 0, circleX: 0, circleY: 0, angle: 0, buffer: 0 };
    #angle = { begin: 0, start: 0, end: 0 };
    #arrow = { a: 0, x: 0, y: 0, angle: 0, buffer: 0, distance: 0, length: 0, beginDistance: 0 };

    get x() { return this.#label.circleX; }
    get y() { return this.#label.circleY; }
    get arc() { return this.#arc; }
    get source() { return this.#source; }
    get target() { return this.#target; }
    get signals() { return this.#signal.data; }
    get rotation() { return this.#rotation; }
    get strength() { return this.#strength; }

    set strength(strength) { return this.#strength = strength; }

    constructor(configuration) {
        super(Item.EDGE, configuration);

        _validateAssigned(configuration.source, "Source node 'source' must be provided in configuration.");
        _validateAssigned(configuration.target, "Target node 'target' must be provided in configuration.");

        this.#source = configuration.source;
        this.#target = configuration.target;

        if (configuration.arc !== undefined) this.#arc = configuration.arc;
        if (configuration.rotation !== undefined) this.#rotation = configuration.rotation;
        if (configuration.strength !== undefined) this.#strength = configuration.strength;

        this.source.addOutboundEdge(this);
        this.target.addInboundEdge(this);
    }

    addSignal(signal) {
        // if too many overall just return
        if (Edge.#allSignals.length > Edge.#MAX_SIGNALS) {
            return;
        }

        // if too many overall just return
        if (this.signals.length > Edge.#MAX_SIGNALS_PER_EDGE) {
            return;
        }

        // re-create signal
        var delta = signal.delta;

        var newSignal = {
            delta: delta,
            position: 0,
            scaleX: Math.abs(delta),
            scaleY: delta
        };

        if (signal.age) {
            // if expired let it die
            if (signal.age <= 0) return;

            newSignal.age = signal.age - 1
        }

        // add to signals, it's a queue
        this.signals.unshift(newSignal);

        // add to all signals
        Edge.#allSignals.push(newSignal);
    };

    getBoundingBox(context) {
        if (this.isLoop()) {
            var perpendicular = a - Math.TAU / 4;
            var cx = (this.#parameters.sx + Math.cos(perpendicular) * -this.#parameters.y2) / 2; // un-retina (divide to 2)
            var cy = (this.#parameters.sy + Math.sin(perpendicular) * -this.#parameters.y2) / 2; // un-retina (divide to 2)
            var _radius = this.#parameters.r / 2; // un-retina
            return {
                left: cx - _radius,
                top: cy - _radius,
                right: cx + _radius,
                bottom: cy + _radius
            };
        }

        // THREE POINTS: start, end, and perpendicular with r
        var from = { x: this.source.x, y: this.source.y };
        var to = { x: this.target.x, y: this.target.y };
        var mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

        var perpendicular = this.#parameters.a - Math.TAU / 4;
        mid.x += Math.cos(perpendicular) * this.#arc;
        mid.y += Math.sin(perpendicular) * this.#arc;

        // TEST ALL POINTS
        var left = Infinity;
        var top = Infinity;
        var right = -Infinity;
        var bottom = -Infinity;
        var points = [from, to, mid];
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var x = point.x;
            var y = point.y;
            if (left > x) left = x;
            if (top > y) top = y;
            if (right < x) right = x;
            if (bottom < y) bottom = y;
        }

        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom
        };
    };

    draw(context, configuration) {
        // width & color
        context.lineWidth = 4 * Math.abs(this.#strength) - 2;
        context.strokeStyle = "#666666";

        // translate & rotate
        context.save();
        context.translate(this.#parameters.sx, this.#parameters.sy);
        context.rotate(this.#parameters.a);

        // highlight selected
        if (this.selected) {
            context.save();
            context.translate(this.#label.x, this.#label.y);
            context.rotate(-this.#parameters.a);
            context.beginPath();
            context.arc(0, 5, 60, 0, Math.TAU, false);
            context.fillStyle = HIGHLIGHT_COLOR;
            context.fill();
            context.restore();
        }

        // arc
        context.beginPath();
        if (this.#arc > 0) {
            context.arc(this.#parameters.w / 2, this.#parameters.y2, this.#parameters.r, this.#angle.start, this.#parameters.end, false);
        } else {
            context.arc(this.#parameters.w / 2, this.#parameters.y2, this.#parameters.r, -this.#angle.start, this.#parameters.end, true);
        }

        // arrow head
        context.save();
        context.translate(this.#arrow.x, this.#arrow.y);
        if (this.#arc < 0) context.scale(-1, -1);
        context.rotate(this.#arrow.a);
        context.moveTo(-this.#arrow.length, -this.#arrow.length);
        context.lineTo(0, 0);
        context.lineTo(-this.#arrow.length, this.#arrow.length);
        context.restore();

        // draw it
        context.stroke();

        // draw label
        context.font = "100 60px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.save();
        context.translate(this.#label.x, this.#label.y);
        context.rotate(-this.#parameters.a);
        context.fillStyle = "#999999";
        context.fillText(this.#label.text, 0, 0);
        context.restore();

        // draw signals
        this.#drawSignals(context);

        // Restore
        context.restore();
    }

    initialize(model, mouse) {
        this.#reset();

        this.#listeners.modelreset = subscribe("model/reset", function () { this.#onModelReset(model) }.bind(this));
    }

    isAssociated(node) {
        return this.source == node || this.target == node;
    };

    isLoop() {
        return this.source == this.target;
    }

    isPointOnLabel(x, y, buffer) {
        return _isPointInCircle(x, y, this.#label.circleX, this.#label.circleY, buffer);
    };

    kill() {
        unsubscribe("model/reset", this.#listeners.modelreset);

        this.source.removeOutboundEdge(this);
        this.target.removeInboundEdge(this);

        publish("kill", [this]);
    };

    move(x, y) {
        if (this.isLoop()) {
            // just get angle & mag for label
            var dx = x - this.source.x;
            var dy = y - this.source.y;
            var a = Math.atan2(dy, dx);
            var mag = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            var minimumMag = this.source.radius + 25;
            mag = Math.max(mag, minimumMag);

            // update edge
            this.#arc = mag;
            this.#rotation = a * (360 / Math.TAU) + 90;
        } else {
            // the Arc: whatever label *Y* is, relative to angle & first node's pos
            var sx = this.source.x;
            var sy = this.source.y;
            var tx = this.target.x;
            var ty = this.target.y;

            var dx = tx - sx;
            var dy = ty - sy;

            var a = Math.atan2(dy, dx);

            // Calculate arc
            var points = [[x, y]];
            var translated = _translatePoints(points, -sx, -sy);
            var rotated = _rotatePoints(translated, -a);
            var newLabelPoint = rotated[0];

            this.#arc = -newLabelPoint[1];
        }
    }

    update(mouse, configuration) {
        // Edge case: if arc is EXACTLY zero, whatever, add 0.1 to it.
        if (this.#arc == 0) this.#arc = 0.1;

        // retina calculations
        this.#parameters.sx = this.source.x * 2;
        this.#parameters.sy = this.source.y * 2;
        this.#parameters.tx = this.target.x * 2;
        this.#parameters.ty = this.target.y * 2;
        if (this.isLoop()) {
            var rotation = this.rotation;
            rotation *= Math.TAU / 360;
            this.#parameters.tx += Math.cos(rotation);
            this.#parameters.ty += Math.sin(rotation);
        }

        this.#parameters.dx = this.#parameters.tx - this.#parameters.sx
        this.#parameters.dy = this.#parameters.ty - this.#parameters.sy
        this.#parameters.w = Math.sqrt(Math.pow(this.#parameters.dx, 2) + Math.pow(this.#parameters.dy, 2));
        this.#parameters.a = Math.atan2(this.#parameters.dy, this.#parameters.dx);
        this.#parameters.h = Math.abs(this.#arc * 2);

        // from: http://www.mathopenref.com/arcradius.html
        this.#parameters.r = (this.#parameters.h / 2) + (Math.pow(this.#parameters.w, 2) / (8 * this.#parameters.h));
        this.#parameters.y = this.#parameters.r - this.#parameters.h; // the circle's y-pos is radius - given height.
        this.#parameters.a2 = Math.acos((this.#parameters.w / 2) / this.#parameters.r); // angle from x axis, arc-cosine of half-width & radius

        // arrow buffer
        this.#arrow.buffer = 15;
        this.#arrow.distance = (this.target.radius + this.#arrow.buffer) * 2;
        this.#arrow.angle = this.#arrow.distance / this.#parameters.r; // (distance/circumference)*TAU, close enough.
        this.#arrow.beginDistance = (this.source.radius + this.#arrow.buffer) * 2;
        this.#angle.begin = this.#arrow.beginDistance / this.#parameters.r;

        // arc it
        this.#angle.start = this.#parameters.a2 - Math.TAU / 2;
        this.#angle.end = -this.#parameters.a2;
        if (this.#parameters.h > this.#parameters.r) {
            this.#angle.start *= -1;
            this.#angle.end *= -1;
        }
        if (this.#arc > 0) {
            this.#parameters.y2 = this.#parameters.y;
            this.#parameters.begin = this.#angle.start + this.#angle.begin;
            this.#parameters.end = this.#angle.end - this.#arrow.angle;
        } else {
            this.#parameters.y2 = -this.#parameters.y;
            this.#parameters.begin = -this.#angle.start - this.#angle.begin;
            this.#parameters.end = -this.#angle.end + this.#arrow.angle;
        }

        // arrow head
        this.#arrow.length = 10 * 2;
        this.#arrow.x = this.#parameters.w / 2 + Math.cos(this.#parameters.end) * this.#parameters.r;
        this.#arrow.y = this.#parameters.y2 + Math.sin(this.#parameters.end) * this.#parameters.r;
        this.#arrow.a = this.#parameters.end + Math.TAU / 4;

        // My label is...
        var dash = "–";
        var s = this.#strength;
        if (s >= 3) this.#label.text = "+++";
        else if (s >= 2) this.#label.text = "++";
        else if (s >= 1) this.#label.text = "+";
        else if (s == 0) this.#label.text = "?";
        else if (s >= -1) this.#label.text = dash; // EM dash, not hyphen
        else if (s >= -2) this.#label.text = dash + " " + dash;
        else this.#label.text = dash + " " + dash + " " + dash;

        // label position
        var labelPosition = this.#getPositionAlongArrow(0.5);
        this.#label.x = labelPosition.x;
        this.#label.y = labelPosition.y;

        // label position, for grabbing purposes
        this.#label.circleX = (this.#parameters.sx + Math.cos(this.#parameters.a) * this.#label.x - Math.sin(this.#parameters.a) * this.#label.y) / 2; // un-retina
        this.#label.circleY = (this.#parameters.sy + Math.sin(this.#parameters.a) * this.#label.x + Math.cos(this.#parameters.a) * this.#label.y) / 2; // un-retina

        // add offset to label
        this.#label.buffer = 18 * 2; // retina
        if (this.#arc < 0) this.#label.buffer *= -1;
        this.#label.y += this.#label.buffer;

        // update signals
        this.#updateSignals(mouse, configuration);
    };

    /**********************************************************************/
    // PRIVATE METHODS
    /**********************************************************************/
    #drawSignals = function (context) {
        // Draw each one
        for (var i = 0; i < this.signals.length; i++) {
            // get position to draw at
            var signal = this.signals[i];
            var signalPosition = this.#getPositionAlongArrow(signal.position);
            var signalX = signalPosition.x;
            var signalY = signalPosition.y;

            // Transform
            context.save();
            context.translate(signalX, signalY);
            context.rotate(-this.#parameters.a);

            // Signal's direction & size
            var size = this.#signal.size;
            context.scale(signal.scaleX, signal.scaleY);
            context.scale(size, size);

            // signal's color, blending
            var fromColor = this.source.color;
            var toColor = this.target.color;
            var blend;
            var bStart = 0.4, bEnd = 0.6;
            if (signal.position < bStart) {
                blend = 0;
            } else if (signal.position < bEnd) {
                blend = (signal.position - bStart) / (bEnd - bStart);
            } else {
                blend = 1;
            }
            var signalColor = _blendColors(fromColor, toColor, blend);

            // Also, tween the scaleY, flipping, IF STRENGTH<0
            if (this.#strength < 0) {
                // sin/cos-animate it for niceness.
                var flip = Math.cos(blend * Math.PI); // (0,1) -> (1,-1)
                context.scale(1, flip);
            }

            // Signal's age = alpha.
            if (signal.age == 2) {
                context.globalAlpha = 0.5;
            } else if (signal.age == 1) {
                context.globalAlpha = 0.25;
            }

            // Draw an arrow
            context.beginPath();
            context.moveTo(-2, 0);
            context.lineTo(0, -2);
            context.lineTo(2, 0);
            context.lineTo(1, 0);
            context.lineTo(1, 2);
            context.lineTo(-1, 2);
            context.lineTo(-1, 0);
            context.fillStyle = signalColor;
            context.fill();

            // Restore
            context.restore();
        }
    }

    #getArrowLength() {
        var angle;
        if (this.isLoop()) {
            return this.#parameters.r * Math.TAU - 2 * this.source.radius;
        } else {
            if (this.#parameters.y < 0) {
                // arc's center is above the horizon
                if (this.#arc < 0) { // ccw
                    angle = Math.TAU + this.#parameters.begin - this.#parameters.end;
                } else { // cw
                    angle = Math.TAU + this.#parameters.end - this.#parameters.begin;
                }
            } else {
                // arc's center is below the horizon
                angle = Math.abs(this.#parameters.end - this.#parameters.begin);
            }
        }
        return this.#parameters.r * angle;
    };

    #getPositionAlongArrow(parameter) {
        parameter = -0.05 + parameter * 1.1; // (0,1) --> (-0.05, 1.05)

        // if the arc's circle is actually BELOW the line
        var begin2 = this.#parameters.begin;
        if (this.#parameters.y < 0) { // DON'T KNOW WHY THIS WORKS, BUT IT DOES.
            if (begin2 > 0) {
                begin2 -= Math.TAU;
            } else {
                begin2 += Math.TAU;
            }
        }

        // get angle
        var angle = begin2 + (this.#parameters.end - begin2) * parameter;

        // return x & y
        return {
            x: this.#parameters.w / 2 + Math.cos(angle) * this.#parameters.r,
            y: this.#parameters.y2 + Math.sin(angle) * this.#parameters.r
        };
    };

    #removeSignal(signal) {
        this.signals.splice(this.signals.indexOf(signal), 1);
        Edge.#allSignals.splice(Edge.#allSignals.indexOf(signal), 1);
    };

    #reset() {
        Edge.#allSignals = [];
        this.#signal.data = [];
    }

    #updateSignals(mouse, configuration) {
        var speed = Math.pow(2, configuration.animationSpeed);
        this.#signal.speed = speed / this.#getArrowLength();

        // Move all signals along
        for (var i = 0; i < this.signals.length; i++) {
            var signal = this.signals[i];
            signal.position += this.#signal.speed;
        }

        // If any signals reach >=1, pass 'em along
        var lastSignal = this.signals[this.signals.length - 1];
        while (lastSignal && lastSignal.position >= 1) {

            // Actually pass it along
            lastSignal.delta *= this.#strength; // flip at the end only
            this.target.takeSignal(lastSignal);

            // pop it, move on down
            this.#removeSignal(lastSignal);
            lastSignal = this.signals[this.signals.length - 1];
        }
    }
    /**********************************************************************/
    // EVENT METHODS
    /**********************************************************************/
    #onModelReset(model) {
        this.#reset();
    }
}