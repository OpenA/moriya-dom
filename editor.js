
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

const kana = new KanakoInput();
const edit = document.getElementById('example-editor');

edit.appendChild(kana.kaNakoInput).classList.add('ko-moko');

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
