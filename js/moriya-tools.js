/**
 * **Moriya UI Dragable**
 * 
 */
const MUIDragable = {

	zIndex: 1,

	DOWN: 'mousedown',
	MOVE: 'mousemove',
	UP: 'mouseup',

	hasTouch: 'ontouchstart' in window,
/**
 * Bind live action for element with init point params
 * 
 * returns a promise that resolves at the action end
 *
 * @param {HTMLElement} el element for action
 * @param {Object} [point] use getPoint for create this from event, or make personaly
 * @param {Number} [point.pointX] initial X pos
 * @param {Number} [point.pointY] initial Y pos
 * @param {Number} [point.minW] minimum Width (for `resize` action)
 * @param {Number} [point.minH] minimum Height (for `resize` action)
 * @param {String} [point.action] fn name (`resize` or `drop`)
 * @param {Boolean} [point.isTouch] is point using touch-event
 * @param {Boolean} [point.hasFixed] is element fixed position
 * @param {(m:{},e:UIEvent) => void} [point.onAction] fired if point changed
 */
	live(el, point = {}) {
		const { style } = el;
		const { left, top, width, height } = el.getBoundingClientRect();
		const {
			minW = 0, isTouch = this.hasTouch, action,
			minH = 0, hasFixed = style.position === 'fixed' } = point;

		let offsetX = 0, fchange = () => void 0, offsetY = 0;
		let { onAction, pointX, pointY } = point;
		if (!(onAction instanceof Function))
		      onAction = fchange;

		switch (action) {
		case 'resize':
			if (pointX) offsetX = left + width - pointX;
			if (pointY) offsetY = top + height - pointY;
			fchange = (x, y, e) => {
				let w = x - left + offsetX, h = y - top + offsetY;
				style.width  = `${w = minW > w ? minW : w}px`;
				style.height = `${h = minH > h ? minH : h}px`;
				onAction({
					pointX: x, pointY: y, left, top, width: w, height: h
				}, e);
			};
			break;
		case 'drag':
			pointX = pointX ? pointX - left : left;
			pointY = pointY ? pointY - top : top;
			style.position = hasFixed ? 'fixed' : 'absolute';
			style.zIndex = ++this.zIndex;
			style.left = `${left + (hasFixed ? offsetX = window.pageXOffset : 0)}px`;
			style.top  = `${top  + (hasFixed ? offsetY = window.pageYOffset : 0)}px`;
			fchange = (x, y, e) => {
				let l = x - pointX, t = y - pointY;
				style.left = `${l + offsetX}px`;
				style.top  = `${t + offsetY}px`;
				onAction({
					pointX: x, pointY: y, left: l, top: t, width, height
				}, e);
			};
			break;
		default:
			fchange = (x, y, e) => onAction({
				pointX: x, pointY: y, left, top, width, height
			}, e);
		}
		return this.addListener(el, fchange, isTouch);
	},
/**
 * Low-level function who create point move listener at screen.
 *
 * @param {HTMLElement} el
 * @param {(x:Number,y:Number,e:UIEvent) => void} handler
 * @param {Boolean} touch
 */
	addListener: (el, handler, touch = false) => new Promise(fin => {

		const mov = touch ? 'touchmove' : 'mousemove',
		      end = touch ? 'touchend' : 'mouseup';

		const onMove = e => {
			const { clientX, clientY } = touch ? e.changedTouches[0] : e;
			handler(clientX, clientY, e);
		}
		const onEnd = () => {
			el.removeEventListener(mov, onMove);
			el.removeEventListener(end, onEnd);
			if (touch)
				el.removeEventListener('touchcancel', onEnd);
			fin();
		}
		if (touch) {
			el.addEventListener('touchcancel', onEnd);
		} else
			el = window;
		el.addEventListener(mov, onMove);
		el.addEventListener(end, onEnd);
	}),
/**
 * Get single point {x,y}
 *
 * @param {UIEvent} e mouse or touch event
 */
	getPoint: (e) => {
		const { touches, button } = e;

		if (touches ? touches.length !== 1 : button > 0)
			return null;

		let o = Object.create(null);
		if (touches) {
			o.pointX = touches[0].clientX,
			o.pointY = touches[0].clientY, o.isTouch = true;
		} else {
			o.pointX = e.clientX,
			o.pointY = e.clientY, o.isTouch = false;
		}
		return o;
	}
}

if (MUIDragable.hasTouch) {
	MUIDragable.DOWN = 'touchstart';
	MUIDragable.MOVE = 'touchmove';
	MUIDragable.UP   = 'touchend';
}

/**
 * **Moriya Animation** - a high-level implementation of JS Animation
 * * `dropDelay` - sets time delay between iterations in milliseconds
 * * `duration` - sets iteration time in milliseconds
 * * `onIteration` - sets a custom function that is called every iteration
 * * `reset(true | false)` - (re)starting or cancelling animation
 */
class MoriyaAnimation {
/**
 * @param {Number} duration per iteration in milliseconds
 */
	constructor(duration = 1200) {
		const _emit = (time = 0) => {
			const { startTime, dropDelay, duration, onIteration } = this,
			    changeTime = (dropDelay <= 0 ? duration : dropDelay) <= (time - startTime),
			    iterChange = dropDelay <= 0 && changeTime && onIteration instanceof Function;
			if (changeTime) {
				 this.dropDelay = 0;
				_emit.startTime = time;
			}
			_emit.id = window.requestAnimationFrame(_emit);
			if (iterChange)
				this.onIteration();
		};
		this.duration = duration;
		this.dropDelay = 0;
		this.onIteration = null;
		Object.defineProperty(this, '_emit', { value: _emit });
	}
	reset(reStart = true) {
		const { _emit } = this;
		if (_emit.id >= 0)
			window.cancelAnimationFrame(_emit.id);
		_emit.startTime = this.dropDelay = 0;
		_emit.id = reStart ? window.requestAnimationFrame(time => {
			_emit.startTime = time;
			_emit.id = window.requestAnimationFrame(_emit);
		}) : -1;
	}
}

/** simple utility for create/change DOM elements
 * 
 * returns `element` or `empty string` for non-exception read attributes
 * 
 * @param {HTMLElement|String} el element or nodeName "span", "div" etc
 * @param {Object} attrs attributes like `class: str, onclick: fn, "my-prop": int, hidden: bool` etc.
 * special attributes - `text: ""` or `html: "</div>"`
 * @param {Object} events DOM3 Event Listeners `click: function or [ ...functions ]`
*/
function _setup(el, attrs = {}, events = {}) {

	if (!el)
		return ''; // safe for ''.nextSibling
	if (typeof el === 'string')
		el = document.createElement(el);

	let hasContent = false, text = '', html = '';
	for (const key in attrs) {
		 const val = attrs[key];

		/**/ if (key === 'html')
			html = val, text = '', hasContent = true;
		else if (key === 'text')
			text = val, html = '', hasContent = true;
		else if (val === undefined)
			el.removeAttribute(key);
		else if (!(key in el && (el[key] = val, el[key] == val)))
			el.setAttribute(key, val);
	}
	if (hasContent) {
		const doc = html && new DOMParser().parseFromString(html, 'text/html');
		el.textContent = text;
		if (doc) el.append( ...doc.body.children );
	}
	for (const name in events) {
		 const func = events[name];
		if (Array.isArray(func))
			func.forEach(handler => el.addEventListener(name, handler));
		else
			el.addEventListener(name, func);
	}
	return el;
}
