
const UIDragable = {

	zIndex: 1,

	DOWN: 'mousedown',
	MOVE: 'mousemove',
	UP: 'mouseup',

	hasTouch: 'ontouchstart' in window,

	live(el, {
		action = '', callback = () => void 0,
		pointX = 0, minW = 0, isTouch = false,
		pointY = 0, minH = 0, hasFixed = false
	}) {
		const { style } = el;
		const { x, y  } = el.getBoundingClientRect();

		const offsetX = hasFixed ? 0 : window.pageXOffset;
		const offsetY = hasFixed ? 0 : window.pageYOffset;
		let   onMove  = () => void 0;

		if (action === 'drag') {
			style.position = hasFixed ? 'fixed' : 'absolute';
			style.zIndex   = (++this.zIndex);
			style.left     = (x + offsetX) +'px'; pointX -= x;
			style.top      = (y + offsetY) +'px'; pointY -= y;
			onMove = (movX, movY) => {
				style.left = `${movX - pointX + offsetX}px`;
				style.top  = `${movY - pointY + offsetY}px`;
			}
		} else if (action === 'resize') {
			(onMove = (movX, movY) => {
				style.width  = `${minW > (movX -= x) ? minW : movX}px`;
				style.height = `${minH > (movY -= y) ? minH : movY}px`;
			})(pointX, pointY);
		}
		if (isTouch) {
			const onEnd = e => {
				let { type, changedTouches: [o] } = e;
				if (type.charAt('touch'.length) === 'm') {
					onMove(o.clientX, o.clientY);
				} else {
					el.removeEventListener('touchmove', onEnd);
					el.removeEventListener('touchend', onEnd);
					el.removeEventListener('touchcancel', onEnd);
				}
				callback(e);
			}
			el.addEventListener('touchmove', onEnd);
			el.addEventListener('touchend', onEnd);
			el.addEventListener('touchcancel', onEnd);
		} else {
			const onEnd = (e) => {
				if (e.type === this.UP) {
					window.removeEventListener(this.MOVE, onEnd);
					window.removeEventListener(this.UP, onEnd);
				} else
					onMove(e.clientX, e.clientY);
				callback(e);
			}
			window.addEventListener(this.MOVE, onEnd);
			window.addEventListener(this.UP, onEnd);
		}
	},

	getPoint: (e) => {
		const isTouch = 'touches' in e;
		const p = isTouch ? e.touches[0] : e;

		if (isTouch && e.touches.length !== 1 || e.button > 0)
			return null;
		return { isTouch, pointX: p.clientX, pointY: p.clientY };
	}
}

if (UIDragable.hasTouch) {
	UIDragable.DOWN = 'touchstart';
	UIDragable.MOVE = 'touchmove';
	UIDragable.UP   = 'touchend';
}

class AnimFrameTracking {
	constructor(callback = () => void 0) {
		const onFrameUpd = (time = 0) => {
			const { startTime, dropDelay } = this;
			if (dropDelay > 0) {
				if ((time - startTime) >= dropDelay) {
					this.dropDelay = 0;
					this.startTime = time;
				}
			} else if ((time - startTime) >= 1200) {
				this.startTime = time;
				this.callback();
			}
			this.animID = window.requestAnimationFrame(onFrameUpd);
		};
		this.animID = this.dropDelay = this.startTime = 0;
		this.callback = callback;
		this.onFrameUpd = onFrameUpd;
	}
	reset(re = true) {
		if (this.animID)
			window.cancelAnimationFrame(this.animID);
		this.startTime = this.dropDelay = 0;
		this.animID = re ? window.requestAnimationFrame(time => {
			this.startTime = time;
			this.animID = window.requestAnimationFrame(this.onFrameUpd);
		}) : 0;
	}
}

/** simple utility for create/change DOM elements
 * * 0: @tagName `span` `div` or @NodeElement
 * * 1: @Properties `class: str` `onclick: fn` `"my-prop": int` `hidden: bool` etc.
 * * 2: @Listeners `click: function or [ ...functions ]`
*/
function _setup(el, attrs, events) {

	if (!el)
		return ''; // stub for safe gatting attributes ~ ''.nextSibling
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
