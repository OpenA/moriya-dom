
const SET_ELEM  = _setup(document.forms['macros-settings-area'], null, { click: onClickHandler, change: applyChanges }).elements;
const RANGE_VAL = {
	stroke: {
		max: 10,
		min: .5
	},
	font: {
		max: 180,
		min:  10
	}
};

for (let input of SET_ELEM) {
	const param = _APPLICATION_[input.name];
	if (input.type === 'checkbox') {
		input.checked = input.name.includes(param);
	} else
		input.value = param;
}

for (let bar of document.getElementsByClassName('size-ruler')) {
	const name = bar.getAttribute('label'),
	      size = _APPLICATION_[`${name}_size`];
	bar.addEventListener('mousedown', barChanger, false);
	bar.lastElementChild.style.left = `${ size / RANGE_VAL[name].max * 100 }%`;
	bar.setAttribute('value', size);
}

const pasL = (() => {
	
	const box = _setup('div', { id: 'pasL_box', style: 'position: absolute;' }),
	   shift  = { ptp: '', sX: 0, sY: 0, eX: 0, eY: 0 },
	   coords = { x1: 0, y1: 0, w: 0, h: 0, x2: 0, y2: 0 },
	   events = { mousemove: areaMovement, mouseup: () => _setup(window, null, { remove: events }) },
	   behind = {
		top   : _setup('div', { id: 'pasl_behind_top'   , class: 'pasl-row-sect pasl-dark' }),
		right : _setup('div', { id: 'pasl_behind_right' , class: 'pasl-col-sect pasl-dark' }),
		left  : _setup('div', { id: 'pasl_behind_left'  , class: 'pasl-col-sect pasl-dark' }),
		bottom: _setup('div', { id: 'pasl_behind_bottom', class: 'pasl-row-sect pasl-dark' }),
		select: _setup('div', { id: 'pasl_behind_select', class: 'pasl-selection-area' }),
		center: _setup('div', { /* pasl_behind_center */  class: 'pasl-col-sect' })
	};
	
	box.append(
		behind['left'],
		behind['center'],
		behind['right']
	);
	behind['center'].append(
		behind['top'],
		behind['select'],
		behind['bottom']
	);
	
	behind['select'].insertAdjacentHTML('afterbegin', (
		'<div class="pasl-touch-zone"><code class="macro-text" id="top-text" contenteditable="true">это место</code></div>'+
		'<div class="pasl-rcons" id="rcon_t-l"></div>'+
		'<div class="pasl-rcons" id="rcon_t-r"></div>'+
		'<div class="pasl-rcons" id="rcon_b-l"></div>'+
		'<div class="pasl-rcons" id="rcon_b-r"></div>'+
		'<div class="pasl-touch-zone"><code class="macro-text" id="bottom-text" contenteditable="true">для макро</code></div>'));
	
	behind['bottom'].insertAdjacentHTML('afterbegin', (
		'<code class="macro-text" id="large-text" contenteditable="true">а это</code>'+
		'<code class="macro-text" id="small-text" style="font-size: 50%" contenteditable="true">для демотиватора</code>'));
	
	const selectionHandler = behind['select'].onmousedown = (e) => {
		e.preventDefault();
		shift.sX = e.clientX;
		shift.sY = e.clientY;
		if (e.target.classList[0] === 'pasl-rcons') {
			shift.ptp = e.target.id.split('_')[1];
			shift.eX = coords.w;
			shift.eY = coords.h;
		} else {
			shift.ptp = 'm-v';
			shift.eX = coords.x1;
			shift.eY = coords.y1;
		}
		_setup(window, null, events);
	};
	
	for (let zone of behind['select'].getElementsByClassName('pasl-touch-zone')) {
		zone.addEventListener('dblclick', () => {
			behind['select'].style.cursor = 'default';
			behind['select'].onmousedown = null;
			zone.firstElementChild.focus();
		});
		zone.firstElementChild.addEventListener('blur', () => {
			behind['select'].style.cursor = 'move';
			behind['select'].onmousedown = selectionHandler;
		});
	}
	
	const SelectArea = {
		get 'x' ( ) { return coords.x1 },
		set 'x' (n) {
				coords.x1 = n > 0 ? n : 0;
				if (coords.x1 + coords.w > coords.size[0]) {
					coords.x1 = coords.size[0] - coords.w;
				}
				coords.x2 = coords.size[0] - coords.x1 - coords.w;
				behind.left.style['width'] = coords.x1 +'px';
				behind.right.style['width'] = coords.x2 +'px';
			},
		get 'y' ( ) { return coords.y1 },
		set 'y' (n) {
				coords.y1 = n > 0 ? n : 0;
				if (coords.y1 + coords.h > coords.size[1]) {
					coords.y1 = coords.size[1] - coords.h;
				}
				coords.y2 = coords.size[1] - coords.y1 - coords.h;
				behind.top.style['height'] = coords.y1 +'px';
				behind.bottom.style['height'] = coords.y2 +'px';
			},
		get 'w' ( ) { return coords.w },
		set 'w' (n) {
				behind.select.style['width'] = (coords.w  = coords.size[0] > n + coords.x1 ? (n > 0 ? n : 0) : coords.size[0] - coords.x1) +'px';
				behind.right.style['width']  = (coords.x2 = coords.size[0] - coords.x1 - coords.w) +'px';
			},
		get 'h' ( ) { return coords.h },
		set 'h' (n) {
				coords.h  = coords.size[1] > n + coords.y1 ? (n > 0 ? n : 0) : coords.size[1] - coords.y1;
				coords.y2 = coords.size[1] - coords.y1 - coords.h;
				behind.select.style['height'] = coords.h  +'px';
				behind.bottom.style['height'] = coords.y2 +'px';
			},
		get 'rw'( ) { return coords.w },
		set 'rw'(n) {
				coords.w  = coords.size[0] > n + coords.x2 ? (n > 0 ? n : 0) : coords.size[0] - coords.x2;
				coords.x1 = coords.size[0] - coords.x2 - coords.w;
				behind.select.style['width'] = coords.w +'px';
				behind.left.style['width']  = coords.x1 +'px';
			},
		get 'rh'( ) { return coords.h },
		set 'rh'(n) {
				coords.h  = coords.size[1] > n + coords.y2 ? (n > 0 ? n : 0) : coords.size[1] - coords.y2;
				coords.y1 = coords.size[1] - coords.y2 - coords.h;
				behind.select.style['height'] = coords.h +'px';
				behind.top.style['height']   = coords.y1 +'px';
			}
	}
	
	function areaMovement(e) {
		var rx, x = e.clientX - shift.sX + shift.eX,
			ry, y = e.clientY - shift.sY + shift.eY;
		switch (shift.ptp) {
			case 'm-v':
				SelectArea.x = x;
				SelectArea.y = y;
				break;
			case 't-l':
				rx = shift.sX - e.clientX + shift.eX;
				ry = shift.sY - e.clientY + shift.eY;
				SelectArea.rw = SelectArea.lock && ry > rx ? ry : rx;
				SelectArea.rh = SelectArea.lock && rx > ry ? rx : ry;
				break;
			case 't-r':
				ry = shift.sY - e.clientY + shift.eY;
				SelectArea.w  = SelectArea.lock && ry > x ? ry : x;
				SelectArea.rh = SelectArea.lock && x > ry ? x : ry;
				break;
			case 'b-l':
				rx = shift.sX - e.clientX + shift.eX;
				SelectArea.rw = SelectArea.lock && y > rx ? y : rx;
				SelectArea.h  = SelectArea.lock && rx > y ? rx : y;
				break;
			case 'b-r':
				SelectArea.w = SelectArea.lock && y > x ? y : x;
				SelectArea.h = SelectArea.lock && x > y ? x : y;
		}
		e.preventDefault();
	}
	function areaSelect(img, points) {
		box.style['width' ] = img.width  +'px';
		box.style['height'] = img.height +'px';
		coords.size  = [img.width, img.height];
		coords.ratio = [img.naturalWidth / img.width, img.naturalHeight / img.height];
		coords.x1 = points.x || 0;
		coords.y1 = points.y || 0;
		coords.w  = points.w || 50;
		coords.h  = points.h || 50;
		for (var vec in points) {
			SelectArea[vec] = points[vec];
		}
	}
	return {
		box: box,
		select: areaSelect,
		getCoords: () => [
			Math.floor(coords.x1 * coords.ratio[0]),
			Math.floor(coords.y1 * coords.ratio[1]),
			Math.floor(coords.w  * coords.ratio[0]),
			Math.floor(coords.h  * coords.ratio[1])
		]
	}
})();

var image = _setup(document.getElementById("someimg"), null, {
	load: function imageLoad() {
		
		var eObj = {
			lock: false,
			x: 0, w: this.width,
			y: 0, h: this.height,
			onSelectEnd: () => {}
		}
		
		if (this.width > this.height) {
			eObj.w = this.height;
			eObj.x = (this.width - this.height) / 2;
		} else
			if (this.width < this.height) {
				eObj.h = this.width;
				eObj.y = (this.height - this.width) / 2;
			}
		
		pasL.select(this, eObj);
		this.parentNode.insertBefore(pasL.box, this)
	}
});

const textUnder = document.getElementById('under-text');
const canvas    = document.getElementById('Canvas');

function drawDemotivator() {
	let [X, Y, W, H] = pasL.getCoords();
	
	let dx = Math.floor(W / 8), dy = dx + H / 2;
	
	canvas.width = (W + dx * 2), canvas.height = H + dy;
	
	const contxt = canvas.getContext('2d');
	
	contxt.fillRect(0, 0, canvas.width, canvas.height);
	contxt.drawImage(image, X, Y, W, H, dx, dx, W, H);
	
	const { stroke_size, stroke_color, font_italic, font_bold, font_size, font_family, font_color } = _APPLICATION_;
	contxt.font        = `${font_italic} ${font_bold} ${font_size}px "${font_family}"`;
	contxt.lineWidth   = stroke_size;
	contxt.strokeStyle = stroke_color;
	contxt.fillStyle   = font_color;
	contxt.textAlign   = 'center';
	
	const textUnder = document.getElementById('under-text').textContent;
	contxt.textBaseline = "bottom";
	contxt.fillText(textUnder, canvas.width/2, H + dy, canvas.width - dx);
	contxt.strokeText(textUnder, canvas.width/2, H + dy, canvas.width - dx);
}

function drawMacro() {
	let [X, Y, W, H] = pasL.getCoords();
	canvas.width = W, canvas.height = H;
	const contxt = canvas.getContext('2d');
	contxt.drawImage(image, X, Y, W, H, 0, 0, W, H);
	
	const { stroke_size, stroke_color, font_italic, font_bold, font_size, font_family, font_color } = _APPLICATION_;
	contxt.font        = `${font_italic} ${font_bold} ${font_size}px "${font_family}"`;
	contxt.lineWidth   = stroke_size;
	contxt.strokeStyle = stroke_color;
	contxt.fillStyle   = font_color;
	contxt.textAlign   = 'center';
	
	const textBottom = document.getElementById('bottom-text').textContent;
	const textTop    = document.getElementById('top-text').textContent;
	
	X = W / 2, Y = Math.floor(font_size / 10);
	
	contxt.textBaseline = 'top';
	contxt.fillText(textTop, X, Y, W);
	contxt.strokeText(textTop, X, Y, W);
	contxt.textBaseline = 'bottom';
	contxt.fillText(textBottom, X, H - stroke_size, W);
	contxt.strokeText(textBottom, X, H - stroke_size, W);
}

function onClickHandler({ target }) {
	switch (target.id) {
		case 'Draw':
			try {
				canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
			} finally {
				drawMacro();
			}
			break;
		case 'Save':
			break;
		case 'Free':
			break;
	}
}

function triggerButton({ target }) {
	switch (target.name) {
		case 'font_size_value':
			break;
		case 'font_family':
			break;
		case 'add_text':
			document.querySelector('.work-area').appendChild(
				_setup('code', { id: 'top-text', class: 'macro-text', contenteditable: false, draggable: true, style: "border: 1px dotted #ccc;background-color: rgba(255,255,255,.3);" }, {
					focus: ({ target }) => {
						target.onmousedown = moveTXT;
					},
					blur: ({ target }) => {
						console.log(target)
						target.contentEditable = false;
						target.onmousedown = moveTXT;
					},
					dblclick: ({ target }) => {
						target.contentEditable = true;
						target.onmousedown = null;
					}
				})
			);
			break;
	}
}
function moveTXT(e) {
	e.preventDefault();
	console.log(e)
	const { left, top } = this.getBoundingClientRect();
	let shiftX = e.clientX - (left + pageXOffset);
	let shiftY = e.clientY - ( top + pageYOffset);
	
	const events = {
		mouseup   : ( ) => _setup(window, null, { remove: events }),
		mousemove : (o) => {
			e.target.style.left = (o.clientX - shiftX) +'px';
			e.target.style.top  = (o.clientY - shiftY) +'px';
		}
	}
	_setup(window, null, events);
}

function applyChanges({ target: { name, value, checked, type } }) {
	if (name in _APPLICATION_) {
		_APPLICATION_[name] = type === 'checkbox' ? checked : value;
		_APPLICATION_.store();
	}
}

function barChanger(e) {
	if (e.button != 0)
		return;
	e.preventDefault();
	
	const parent = this, {
	left,width } = this.getBoundingClientRect();
	const slider = this.lastElementChild;
	const name   = this.getAttribute('label');
	
	const {min, max} = RANGE_VAL[name];
	const maxLeft = width - slider.clientWidth;
	const barMove = ({ clientX }) => {
		let x =  clientX - left - slider.clientWidth;
		let s = Math.floor((clientX - left) / width * max * 10) / 10;
		if (x < 0) {
			x = 0;
		} else if (x > maxLeft) {
			x = maxLeft;
			s = max;
		}
		slider.style.left = `${x}px`;
		parent.setAttribute('value', (
			_APPLICATION_[`${name}_size`] = Math.max(s, min)
		));
	}
	const barEnd = () => {
		_APPLICATION_.store();
		window.removeEventListener('mousemove', barMove, false);
		window.removeEventListener('mouseup', barEnd, false);
	}
	window.addEventListener('mousemove', barMove, false);
	window.addEventListener('mouseup', barEnd, false);
	barMove(e);
}

//var dElem = null;

//var btn = document.getElementById("draw-btn");
//var ctx = c.getContext("2d");
//var fSz = c.width / 10
//var offX = 0
//var offY = 0
//function Modulate(el) {
//    return [
//        (el.naturalWidth / el.clientWidth) * el.clientWidth,
//    	(el.naturalHeight / el.clientHeight) * el.clientHeight
//    ]
//};
//
//btn.onclick = function(e){
//    var pX = img.naturalWidth / img.width, pY = img.naturalHeight / img.height;
//    ctx.drawImage(img, offX*pX,offY*pY, 500*pX, 500*pY, 0, 0, 500,500);
//    ctx.fillText(tt.value,x,fSz);
//	ctx.strokeText(tt.value,x,fSz);
//    ctx.fillText(bt.value,x,y);
//	ctx.strokeText(bt.value,x,y);
//}
//// Fill with gradient
//ctx.font = 'normal bold '+fSz+'px verdana';
//ctx.textAlign = 'center';
//ctx.lineWidth = 3;
//ctx.strokeStyle = 'black';
//ctx.fillStyle = 'white';
//
//tt.oninput = bt.oninput = drawProgress;
//c.onclick = function(e){
//	if (e.offsetY > this.height / 2)
//        bt.focus()
//    else if (e.offsetY < this.height / 2)
//        tt.focus()
//}
//c.onmousedown = function(e){
//	var coords = getCoords(this);
//		dElem = {
//			el: this,
//			shiftX: e.pageX - coords.left,
//			shiftY: e.pageY - coords.top
//		}
//}
//c.onmouseup = function(e){
//	offY = Number(this.style.top.replace('px', ''))
//    offX = Number(this.style.left.replace('px', ''))
//}
//
//document.onmousemove = function(e) {
//	if (dElem) {
//		dElem.el.style.top  = e.clientY - dElem.shiftY + 'px';
//		dElem.el.style.left = e.clientX - dElem.shiftX + 'px';
//    	e.preventDefault()
//    }
//}
//document.onmouseup = function(e) {
//	dElem = null
//}
//	function getCoords(elem) {
//		var box = elem.getBoundingClientRect();
//		return {
//			top: box.top + pageYOffset,
//			left: box.left + pageXOffset
//		}
//	}

function _setup(el, _Attrs, _Events) {
	if (el) {
		if (typeof el === 'string') {
			el = document.createElement(el);
		}
		if (_Attrs) {
			for (var key in _Attrs) {
				_Attrs[key] === undefined ? el.removeAttribute(key) :
				key === 'html' ? el.innerHTML   = _Attrs[key] :
				key === 'text' ? el.textContent = _Attrs[key] :
				key in el    && (el[key]        = _Attrs[key] ) == _Attrs[key]
				             &&  el[key]      === _Attrs[key] || el.setAttribute(key, _Attrs[key]);
			}
		}
		if (_Events) {
			if ('remove' in _Events) {
				for (var type in _Events['remove']) {
					if (_Events['remove'][type].forEach) {
						_Events['remove'][type].forEach(function(fn) {
							el.removeEventListener(type, fn, false);
						});
					} else {
						el.removeEventListener(type, _Events['remove'][type], false);
					}
				}
				delete _Events['remove'];
			}
			for (var type in _Events) {
				el.addEventListener(type, _Events[type], false);
			}
		}
	}
	return el;
}
